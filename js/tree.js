/**
* ownCloud - Files Tree
*
* @author Bastien Ho (EELV - Urbancube)
* @copyleft 2012 bastienho@urbancube.fr
* @projeturl http://ecolosites.eelv.fr/files-tree
*
* Free Software under creative commons licence
* http://creativecommons.org/licenses/by-nc/3.0/
* Attribution-NonCommercial 3.0 Unported (CC BY-NC 3.0)
* 
* You are free:
* to Share — to copy, distribute and transmit the work
* to Remix — to adapt the work
*
* Under the following conditions:
* Attribution — You must attribute the work in the manner specified by the author or licensor (but not in any way that
* suggests  that they endorse you or your use of the work).
* Noncommercial — You may not use this work for commercial purposes.
*
*/
function FileTree(){
	tree=this;
	$('#fileTable').css('width','86%');
	$('#emptyfolder').css('margin-left','20%');
	$('#content').prepend('<div id="files_tree"><div id="dir_browser"><span class="loading">'+t('files_tree','Loading')+'</span></div><div id="files_tree_switcher"></div><div id="files_tree_refresh" class="bt"></div></div>');
	$('#files_tree_switcher').click(function(){tree.toggle()});
	$('#dir_browser').css('width',$('#files_tree').width()-25).css('height',$('#files_tree').height()-40);
	tree.browse('','');
	$('#files_tree_refresh').css('background-image', 'url('+OC.imagePath('files_tree', 'refresh.svg')+')').click(function(){
		$('#dir_browser').html('<span class="loading">'+t('files_tree','Resfreshing files tree')+'</span>');
		tree.browse('','&refresh=1');		
	});
	tree.sync();
}
FileTree.prototype={	
	toggle:function(){
		if($('#files_tree').width()==10){
			$('#fileList').parent().animate({width:'85%'},500);
			$('#files_tree').animate({width:'14%'},500);
		}
		else{
			$('#files_tree').animate({width:10},500);
			$('#fileList').parent().animate({width:$('#content').width()-11},500);
		}
	},
	sync:function(){
		if($('#fileList').parent().css('display')=='none'){
			$('#files_tree').css('display','none');
		}
		else{
			$('#files_tree').css('display','block');
		}
		$('#files_tree').css('height',Math.max($('#content').outerHeight(),$('#fileList').parent().outerHeight()+38));
		$('#dir_browser').css('width',$('#files_tree').width()-25).css('height',$('#files_tree').outerHeight()-38);
		setTimeout('tree.sync()',2000);
	},
	content:function(fileliste){
		FileList.update(fileliste);
		$('#fileList a.name').each(function(){
			$(this).attr('href',decodeURIComponent($(this).attr('href')));
			$(this).parent().parent().attr('data-file',decodeURIComponent($(this).parent().parent().data('file')));
		});
		//
		$('#fileList td.filename').each(function(){
			FileActions.display($(this));
		});
		tree.collex();	
		tree.rescan();
	},
	getshared:function(){
		$.ajax({
			type: 'GET',
			url:'/index.php/apps/files?dir=//Shared',
			dataType: 'html',
			async: true,
			success: function (data) {
				fileliste = $(data).find("#fileList").html();
				fileliste=fileliste.substr(fileliste.indexOf("<tr"));
				$('#fileList').append(fileliste);
				$('#files_tree_shared_line').nextAll('tr').find('a.name').each(function(){
					$(this).attr('href',decodeURIComponent($(this).attr('href')));
					$(this).parent().parent().attr('data-file',decodeURIComponent($(this).parent().parent().data('file')));
				});
				//
				$('#files_tree_shared_line').nextAll('tr').find('td.filename').each(function(){
					FileActions.display($(this));
				});
				tree.rescan();
			}				
		});
	},
	sharedbutton:function(val){
		$('#files_tree_shared_line').remove();
		var ch_sh='';
		var tit = t('files_tree','Show shared content');
		if(val==1){
		  ch_sh='checked';
		  tit = t('files_tree','Hide shared content');	
		} 			
		var ret ='<tr id="files_tree_shared_line"><td colspan="4">';
			ret+='<label id="files_tree_shared_link"><input type="checkbox" name="files_tree_shared_input" id="files_tree_shared_link" '+ch_sh+' />';
			ret+='<span id="files_tree_shared_title">';
			ret+=tit;
			ret+='</span></label></td></tr>';
		$('#fileList').append(ret);
		$('#files_tree_shared_link').change(function(){
			var val=0;
			//console.log(document.getElementById('files_tree_shared_link').checked==true);
			if ($('input[name=files_tree_shared_input]').is(":checked")) {
				val=1;
			}
			$.ajax({
				type: 'POST',
				url: './?app=files_tree&getfile=ajax/save.php&f=shared_show&s='+val,
				dataType: 'html',
				async: true,
				success: function (data) {
					$('#files_tree_shared_line').nextAll('tr').remove();						
					if(val==0){
						$('#fileList tr').filterAttr('data-file','Shared').fadeIn();
						$('#files_tree_shared_title').html(t('files_tree','Show shared content'));
					}
					if(val==1){
						tree.getshared();
						$('#fileList tr').filterAttr('data-file','Shared').fadeOut();
						$('#files_tree_shared_title').html(t('files_tree','Hide shared content'));
					}									
				}
			});
			
		}); 
	},
	browse:function(dir,refresh){
		$('#dropdown').remove();
		$.ajax({
			type: 'POST',
			url:'./?app=files_tree&getfile=ajax/explore.php&dir='+dir+refresh,
			dataType: 'json',
			async: true,
			success: function (k) {
				$('#dir_browser').html(k.list);
				$('#dir_browser ul').attr('class','collapsed');	
				var stats = k.stat;
				if(k.stat){
					for(var f in k.stat){
						$('#dir_browser ul').filterAttr('data-path',f).attr('class',k.stat[f]);						
					}
				}
				$('#dir_browser ul ul li:first-child').click(function(){
					tree.toggle_dir($(this).parent());					
				});	
				if($('#dir').val()=='/' && $('tr').filterAttr('data-file','Shared').length>0){					
					tree.sharedbutton(k.shared);
					if(k.shared==1){
						$('#fileList tr').filterAttr('data-file','Shared').hide();
						tree.getshared();
					}
					else{						
						//tree.content(fileliste,'fileList');
					}					
				}			
				else{
					tree.collex();	
					tree.rescan();
				}
				
			}
		});	
	},
	// For AJAX Navigation
	browseContent:function(url){
		url=url.replace('app_files&dir=','');
		var lastModified = new Date();
		$('#fileList').fadeOut(500,function(){
			$.ajax({
				type: 'GET',
				url:url,
				dataType: 'html',
				async: true,
				success: function (data) {
    				$('#dropdown').remove();
					document.title = $(data).filter('title').text(); 
					$('#dir').val( $(data).find("#dir").val());
				    $('#controls .crumb').animate({width:0,opacity:0},300,function(){
				    	$(this).remove();
				    });	
				    var crumb='';		    
				    $(data).find('#controls .crumb').each(function(){
				    	crumb+=$(this).wrap('<div></div>').parent().html();
				    });
				 	setTimeout(function(){	
				     $('#controls').prepend(crumb);	
				     $('#controls .crumb').css('opacity',0).animate({width:'toggle'},1).animate({width:'toggle',opacity:1},300);
				     tree.browse('','');
				 	},500);
				    			    
				     var fileliste = $(data).find('#fileList').html();				    
					 tree.content(fileliste);					
				  
				  $('#fileList').fadeIn(500);
				}				
			});	
			
		});
		
	},
	rescan:function(){
		console.log('scan');
		var lechem='';
		var la_path = $('#dir').val().split('/');
		$('#dir_browser li').css('background-image', 'url('+OC.imagePath('files_tree', 'closed.png')+')');
		$('#dir_browser ul.expanded').parent().css('background-image', 'url('+OC.imagePath('files_tree', 'open.png')+')');
		for(var ledir in la_path){
			le_dir=la_path[ledir];
			//if(ledir=='') ledir='/';
			if(ledir>0) lechem+='/';
			lechem+=le_dir;
			$('#dir_browser ul').filterAttr('data-path', lechem).attr('class','expanded');					
			$('#dir_browser a').filterAttr('data-pathname', lechem).css('font-weight','700');
		}		
		$('#dir_browser a').filterAttr('data-pathname', lechem).parent('li').css('background-image', 'url('+OC.imagePath('files_tree', 'open.png')+')');
		$('#dir_browser a,#controls .crumb a, #fileList tr[data-type=dir] a.name').click(function(event){
			event.preventDefault();
			location.hash = this.pathname+this.search;
			return false;
			//$(this).attr('href', top.location.host+top.location.pathname+'#'+$(this).attr('href').replace('?','#'));
		});
		
		// Traduction
		$('tr').filterAttr('data-file','Shared').find('span.nametext').text(t('files_tree','Shared'));
		$('a').filterAttr('data-pathname','/Shared').text(t('files_tree','Shared'));
		$('div').filterAttr('data-dir','/Shared').find('a').text(t('files_tree','Shared'));
		
	},
	toggle_dir:function(ul){
		ul.toggleClass('expanded').toggleClass('collapsed');
		if(ul.attr('class')=='expanded'){
			ul.parent('li').css('background-image', 'url('+OC.imagePath('files_tree', 'open.png')+')');
		}
		else{
			ul.parent('li').css('background-image', 'url('+OC.imagePath('files_tree', 'closed.png')+')');
		}
		tree.collex();
		
		
		$.ajax({
			type: 'POST',
			url: './?app=files_tree&getfile=ajax/save.php&d='+ul.data('path')+'&s='+ul.attr('class'),
			dataType: 'html',
			async: true,
			success: function (k) {
				//nothing to do		
			}
		});
	},
	collex:function(){
		$('ul.collapsed').children('li:first-child').stop().attr('class','c');
		$('ul.expanded').children('li:first-child').stop().attr('class','o');
	}
};

$(document).ready(function(){
  if($('#fileList').length>0) {	
	var the_tree=new FileTree();
	// AJAX NAVIGATION
	function on_hashchange(event) {
		var url = window.location.hash.substring(1);
		if (!event || event.type === "DOMContentLoaded")
				return;
		if(url=='' || url.indexOf('dir=')==-1) return;
		the_tree.browseContent(url);
	}
	$(window).bind('hashchange', on_hashchange);
	on_hashchange(true);
  }
});

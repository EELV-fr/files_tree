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
* Commercial use exception granted by Author on Oct 23 2013 
* To Teemu @ Verkkotaito Oy / Eteinen.fi
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
	display_shared=0;
	tree=this;
	$('#content').addClass('filestree');
	$('#fileTable').css('width','86%');
	$('#emptyfolder').css('margin-left','20%');
	$('#content').prepend('<div id="files_tree"><div id="dir_browser"><span class="loading">'+t('files_tree','Loading')+'</span></div><div id="files_tree_switcher"></div><div id="files_tree_refresh" class="bt"></div></div>');
	$('#files_tree_switcher').click(function(){tree.toggle();});
	$('#dir_browser').css('width',$('#files_tree').width()-25).css('height',$('#files_tree').height()-40);
	tree.browse('','');
	$('#files_tree_refresh').css('background-image', 'url('+OC.imagePath('files_tree', 'refresh.svg')+')').click(function(){
		$('#dir_browser').html('<span class="loading">'+t('files_tree','Resfreshing files tree')+'</span>');
		tree.browse('','1');		
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
		if(fileliste==''){
	     	$('#emptyfolder').show();
	     }
	     else{
	     	$('#emptyfolder').hide();
	     	
			FileList.update(fileliste);
			$('#fileList a.name').each(function(){
				$(this).attr('href',decodeURIComponent($(this).attr('href')));
				$(this).parent().parent().attr('data-file',decodeURIComponent($(this).parent().parent().data('file')));
			});
			
			if($('#dir').val()=='/' && $('tr').filterAttr('data-file','Shared').length>0){					
				tree.sharedbutton(display_shared);
				if(display_shared==1){
					$('#fileList tr').filterAttr('data-file','Shared').hide();
					tree.getshared();
				}
				else{						
					//tree.content(fileliste,'fileList');
				}					
			}
			// Parse shared items
			OC.Share.loadIcons('file');
			
			// Re-assign actions			
			$('#fileList tr td.filename').each(function(i,e){
				FileActions.display($(this));
				if ($(e).parent().data('permissions') & OC.PERMISSION_DELETE) {
					$(e).draggable(dragOptions);
				}
			}); 
			$('#fileList tr[data-type="dir"] td.filename').each(function(i,e){
				if ($(e).parent().data('permissions') && OC.PERMISSION_CREATE){
					$(e).droppable(folderDropOptions);
				}
			}); 
			
			
			
			tree.collex();	
			tree.rescan();
		}
	},
	getshared:function(){
		$.ajax({
			type: 'GET',
			url:$('#fileList tr').filterAttr('data-file','Shared').find('a').attr('href'),
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
			if ($('input[name=files_tree_shared_input]').is(":checked")) {
				val=1;
			}
			$.ajax({
				type: 'POST',
				url: OC.linkTo('files_tree', 'ajax/save.php'),
				data:{f:'shared_show',s:val},
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
		if(dir=='undefined') return;
		$.post(OC.linkTo('files_tree', 'ajax/explore.php'),
			{
				data:{dir:dir,refresh:refresh},
				async: true
			},
			function (k) {
				$('#dir_browser').html(k.list);
				$('#dir_browser ul').attr('class','collapsed');	
				var stats = k.stat;
				display_shared=k.shared;
				if(k.stat){
					for(var f in k.stat){
						if(k.stat[f]=='expanded'){
							if($('#dir_browser ul').filterAttr('data-pathname',f).length==0){
								tree.toggle_dir($('#dir_browser li').filterAttr('data-dir',f),0);
							}
						}
						$('#dir_browser ul').filterAttr('data-pathname',f).attr('class',k.stat[f]);						
					}
				}
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
				
			},
			'json'
		);	
	},
	// For AJAX Navigation
	browseContent:function(url){
		url=url.replace('app_files&dir=','');
		if(url=='') url='/';		
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
					// javicarabantes patch 
					//$('.actions').html($(data).find('.actions').html());
  
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
				     tree.rescan();
				 	},500);
				    $('#permissions').val($(data).find('#permissions').val());			    
				     tree.content($(data).find('#fileList').html());					
				  
				  $('#fileList').fadeIn(500);
				}				
			});	
			
		});
		
	},
	rescan:function(){
		var lechem='';
		$('#permissiondenied').fadeOut();

		if($('#permissions').val()<23){
			$('#new, #upload').fadeOut();
		}
		else{
			$('#new, #upload').fadeIn();
		}
		
		if($('#dir').length>0) {	
			var dir = $('#dir').val();
			var la_path = dir.split('/');
			$('#dir_browser li').css('background-image', 'url('+OC.imagePath('files_tree', 'closed.png')+')');
			$('#dir_browser a').css('font-weight','500');
			$('#dir_browser a.ft_sesam').css('background','#FFF');
			for(var ledir in la_path){
				le_dir=la_path[ledir];
				if(ledir>0) lechem+='/';
				lechem+=le_dir;
				tree.open_dir($('a.ft_sesam').filterAttr('data-pathname',lechem).parent());					
				$('#dir_browser a.ft_link').filterAttr('data-pathname', lechem).css('font-weight','700');					
				$('#dir_browser a.ft_sesam').filterAttr('data-pathname', lechem).css('background','#666');
			}		
			$('#dir_browser a,#controls .crumb a, #fileList tr[data-type=dir] a.name').unbind('click').click(function(event){
				event.preventDefault();
				location.hash = this.pathname+this.search;			
				return false;	
			});
			$('div.crumb:not(.last)').droppable(crumbDropOptions);
			$('#dir_browser li').droppable(crumbDropOptions);
			$('#dir_browser a.ft_sesam').unbind('click').click(function(){
				tree.toggle_dir($(this).parent(),1);					
			});
		}
		// Traduction
		$('tr').filterAttr('data-file','Shared').find('span.nametext').text(t('files_tree','Shared'));
		$('a.ft_link').filterAttr('data-pathname','/Shared').text(t('files_tree','Shared'));
		$('div').filterAttr('data-dir','/Shared').find('a').text(t('files_tree','Shared'));
		
	},
	open_dir:function(li){		
		ul = li.children('ul');
		if(li.attr('class')!='expanded'){
			tree.toggle_dir(li,0);
		}
		li.attr('class','expanded');
	},
	toggle_dir:function(li,manual){
		ul = li.children('ul');
		var dirpath = li.children('a:first-child').data('pathname');			
		if(dirpath==undefined) return false;
		if(ul.length==0){
			$.post(OC.linkTo('files_tree', 'ajax/explore.php'),
				{ 
					dir:dirpath,
					from:'toggle_dir'
				},
				function (k) {
					if(k.list!='' && k.list!=null){
						li.children('a:first-child').animate({opacity:1});
						li.append(k.list);
						ul = li.children('ul');
						if(ul.length>0){
							li.attr('class','expanded');
							tree.rescan();
							if(manual==1){
								$.post(OC.linkTo('files_tree', 'ajax/save.php'),
									{
										d:dirpath,
										s:'expanded'
									}
								);
							}								
						}
					}
					else{
						li.children('a:first-child').animate({opacity:0.35});	
					}					
				},
				'json'
			);		
		}
		else if(li.attr('class')=='expanded'){
			li.attr('class','collapsed');
			li.children('ul').remove();
			$.post(OC.linkTo('files_tree', 'ajax/save.php'),
				{
					d:dirpath,
					s:'collapsed'
				}
			);
		}
		else{
			// normally, nothing to do here
		}
		
		
		
	},
	collex:function(){
		//$('li.collapsed ul').children('li:first-child').stop().attr('class','c');
		//$('li.expanded ul').children('li:first-child').stop().attr('class','o');
	}
};

$(document).ready(function(){
  var loc_url = window.location.toString();
  if($('#fileList').length>0 && loc_url.indexOf('public.php?')==-1) {	
  	
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
	if(loc_url.indexOf('files_trashbin')<0 && loc_url.indexOf('filestree_redir')<0){
		var url = window.location.hash.substring(1)+window.location.search;
			console.log(url);
		if(url==''){ // Default comportement
			url=OC.linkTo('files', '');
			window.location='#'+url;
		}
		else if(url=='' || url.substr(0,22)=='?app=files&dir=/Shared'){ // Shared folder
			window.location=OC.linkTo('files', '')+'#/apps/files/'+url+'&filestree_redir';
		}
		else{ // Other cases
			on_hashchange(true);
		}		
	}
	if(loc_url.indexOf('filestree_redir')>0){
		on_hashchange(true);
	}
  }
});

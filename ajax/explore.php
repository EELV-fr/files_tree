<?php  
OCP\JSON::callCheck();
$DEFAULT_ROOT = '_ROOT_TREE';
$DEFAULT_PREFIX='files_tree_cache';

$currentdir=$_POST['dir'];
$refresh= isset($_POST['refresh']) ?: false;
	
$uid=OCP\User::getUser();

function listdir($dir,$dirs_stat){
	$dir = stripslashes($dir);
	$list = \OC\Files\Filesystem::getdirectorycontent($dir);			
	if(sizeof($list)>0){
		$ret='';
		foreach( $list as $i ) {		
			if($i['type']=='dir' && $i['name']!='.') {
				$ret.='<li data-dir="'.$dir.'/'.$i['name'].'"><a data-pathname="'.$dir.'/'.$i['name'].'" class="ft_sesam"></a>';
				$ret.='<a href="./?app=files&dir='.$dir.'/'.$i['name'].'" data-pathname="'.$dir.'/'.$i['name'].'" class="ft_link">';
				$ret.=$i['name'].'</a>';
				if(in_array($dir.'/'.$i['name'],$dirs_stat)) $ret.=listdir($dir.'/'.$i['name'],$dirs_stat);
				$ret.='</li>';
			}			
		}
		if($ret!=''){
			$ret= '<ul data-path="'.$dir.'">'.$ret.'</ul>';
		}
		return stripslashes($ret);
	}
}
/* Get opened folders */
$dirs_stat = OC_Preferences::getValue($uid,'files_tree','dirs_stat','');
if($dirs_stat=='') $dirs_stat=array();
else $dirs_stat=unserialize($dirs_stat);
// Clean
$s=array();
foreach($dirs_stat as $dir=>$stat){
	if(substr($dir,0,1)=='/') $s[$dir]=$stat;
}
$dirs_stat=$s;


/* Caching results */
$loglist='';
$inilist='';
$dir_cache_file=$DEFAULT_PREFIX.(!empty($currentdir) ? str_replace("/", "_", $currentdir) : $DEFAULT_ROOT);

$cache = new OC_Cache_File;

if (!$refresh && null !== $loglist = $cache->get($dir_cache_file)){
	$inilist=$loglist;
}

if($loglist==''){
	$loglist = listdir($currentdir,$dirs_stat);
}
if($loglist!='' && $inilist==''){	
	$cache->set($dir_cache_file, $loglist);	
	\OC_Log::write('files_tree', 'cache saved to file ' . $dir_cache_file, \OC_Log::DEBUG);
}
/* Sendind results */
$shared_show = OC_Preferences::getValue($uid,'files_tree','shared_show','1');
	
echo json_encode(
	array(
		'list'=>$loglist,
		'stat'=>$dirs_stat,
		'shared'=>$shared_show
	)
);

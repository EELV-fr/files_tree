<?php
OCP\JSON::callCheck();
$uid=OCP\User::getUser();
if(isset($_REQUEST['d']) && isset($_REQUEST['s'])){
	$dirs_stat = OC_Preferences::getValue($uid,'files_tree','dirs_stat','');
	if($dirs_stat=='') $dirs_stat=array();
	else $dirs_stat=unserialize($dirs_stat);
	$dirs_stat[$_REQUEST['d']]=$_REQUEST['s'];
	OC_Preferences::setValue($uid,'files_tree', 'dirs_stat', serialize($dirs_stat));
}
elseif(isset($_REQUEST['f']) && isset($_REQUEST['s'])){
	OC_Preferences::setValue($uid,'files_tree', 'shared_show', $_REQUEST['s']);
}
?>
<?php
class OC_FilesTree_Hooks{
	public static function ClearCache($parameters) {
		if(is_array($parameters)){
			if(\OC\Files\Filesystem::is_dir($parameters['path'].'/') || basename(getenv('REQUEST_URI'))=='newfolder.php'){
				$cache = new OC\Cache\UserCache;
				$parent = $_POST['dir'];
				$cache->remove('files_tree_cache'.$parent);
			}
			else{
				// Nothing to do here
			}
		}
	}
}
<?php
class OC_FilesTree_Hooks{
	public static function ClearCache($parameters) {
		if(is_array($parameters)){
			if(\OC\Files\Filesystem::is_dir($parameters['path'].'/') || basename(getenv('REQUEST_URI'))=='newfolder.php'){
				$cache = new OC_Cache_File();
				$currentdir = $_POST['dir'];
				$cache->remove('files_tree_cache'.(!empty($currentdir) ? str_replace("/", "_", $currentdir) : '_ROOT_TREE'));
			}
			else{
				// Nothing to do here
			}
		}
	}
}

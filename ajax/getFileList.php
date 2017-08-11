<?php
$folder = $_POST['folder'];
$file_extention = $_POST['ext'];
// $folder = $_GET['folder'];
// $file_extention = $_GET['ext'];

$i = 1;

$fileData = getFileTree( new DirectoryIterator( '../'.$folder ) );
$fileData = '{"n":"'.$folder.'","i":0,"children":'.json_encode($fileData).'}';

echo $fileData;
// echo json_encode($fileData);



function getFileTree( DirectoryIterator $dir ) {
	global $file_extention, $folder, $i;

	$data = array();
	foreach ( $dir as $node ) {
		$fn = $node->getFilename();
		$fn = preg_replace("/\.".$file_extention."$/", "", $fn);

		if ( $node->isDir() && !$node->isDot() ) {
			$data[] = (object)array(
	  			"children" => getFileTree( new DirectoryIterator( $node->getPathname() ) ),
	  			"n" => $fn,
	  			"i" => $i
			);
			$i++;
		}
		else if ( $node->isFile() ) {
			if ($fn != ".DS_Store" && $fn != "_".$folder && substr($fn, 0, 1) != "+") {
				// Exclude non $file_extention filetypes
				$explode = explode(".", $fn);
				if (count($explode) == 1) {
					if (substr($fn, 0, 1) != "-")
						$s = $node->getSize();
					else
						$s = 5000;

			  		$data[] = (object)array(
			  			"n" => $fn,
			  			"s" => $s,
			  			"i" => $i
			  		);
			  		$i++;
			  	}
		  	}
		}
	}

	return $data;
}
?>
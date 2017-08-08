<?php
$folder = '../'.$_POST['folder'];
// $content = '../'.$_POST['content'];
// $extention = $_POST['ext'];

$i = 1;

$fileData = getFileTree( new DirectoryIterator( $folder ) );

// $fileData = trim(json_encode($fileData), "[]");
// $fileData = '{"n":"Documentatie","i":0,"children":'.json_encode($fileData).'}';
$fileData = '{"n":"'.$_POST['folder'].'","i":0,"children":'.json_encode($fileData).'}';

echo $fileData;
// echo json_encode($fileData);



function getFileTree( DirectoryIterator $dir ) {
	$file_extention = $_POST['ext'];
	global $i;

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
			if ($fn != ".DS_Store" && $fn != "_".$_POST['folder']) {
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
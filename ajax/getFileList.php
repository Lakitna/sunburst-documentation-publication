<?php
$folder = '../'.$_POST['folder'];
// $extention = $_POST['ext'];

$i = 1;

$fileData = getFileTree( new DirectoryIterator( $folder ) );

// $fileData = trim(json_encode($fileData), "[]");
$fileData = '{"n":"Documentatie","i":0,"children":'.json_encode($fileData).'}';

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


// function getFileTree( DirectoryIterator $dir ) {
// 	$file_extention = "md";
// 	global $i;

// 	$data = array();
// 	foreach ( $dir as $node ) {
// 		$fn = $node->getFilename();
// 		$fn = preg_replace("/\.".$file_extention."$/", "", $fn);

// 		if ( $node->isDir() && !$node->isDot() ) {
// 			$data[$i] = getFileTree( new DirectoryIterator( $node->getPathname() ) );
// 			$data[$i]["n"] = $node->getFilename();
// 			$data[$i]["folder"] = true;
// 			$data[$i]["i"] = $i;
// 			$i++;
// 		}
// 		else if ( $node->isFile() ) {
// 			if ($fn != ".DS_Store") {
// 		  		// $data[$node->getFilename()] = array("n" => $fn, "s" => $node->getSize());
// 		  		$data[$i]["n"] = $fn;
// 		  		$data[$i]["s"] = $node->getSize();
// 		  		$data[$i]["folder"] = false;
// 		  		$data[$i]["i"] = $i;
// 		  		$i++;
// 		  	}
// 		}
// 	}
// 	return $data;
// }
?>
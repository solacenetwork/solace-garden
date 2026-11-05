<?php
// Check if resize parameter is set to true
if (isset($_GET['resize']) && $_GET['resize'] == 'true') {
    echo "Resizing all images in current directory";

    // Open the current directory
    $files = scandir(__DIR__);

    // Iterate through files
    foreach ($files as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) == 'jpg') {
            $image_info = getimagesize($file);
            $width = $image_info[0];
            $height = $image_info[1];

            // Calculate new dimensions while maintaining aspect ratio
            $new_width = 700;
            $new_height = intval($height * ($new_width / $width));

            // Create a new true color image
            $image_resized = imagecreatetruecolor($new_width, $new_height);

            // Load the original image
            $image_original = imagecreatefromjpeg($file);

            // Resize and resample the original image to the new dimensions
            imagecopyresampled($image_resized, $image_original, 0, 0, 0, 0, $new_width, $new_height, $width, $height);

            // Overwrite the existing image with the resized version
            imagejpeg($image_resized, $file);

            // Free up memory
            imagedestroy($image_original);
            imagedestroy($image_resized);
        }
    }

    exit; // Stop further execution after resizing images
}
else {
    // If resize parameter is not set or not equal to true, display image information as before

    // Open the current directory
    $files = scandir(__DIR__);

    // Iterate through files
    foreach ($files as $file) {
        if (pathinfo($file, PATHINFO_EXTENSION) == 'jpg') {
            $image_info = getimagesize($file);
            $width = $image_info[0];
            $height = $image_info[1];

            echo '<ul>';
            echo '<li>' . $file . ' - ' . $width . 'px wide by ' . $height . 'px high</li>';
            echo '</ul>';
        }
    }    
}

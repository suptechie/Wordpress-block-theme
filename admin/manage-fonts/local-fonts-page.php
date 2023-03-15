<?php

require_once( __DIR__ . '/fonts-page.php' );

class Local_Fonts {
	public static function local_fonts_admin_page() {
		// JS dependencies needed to read the file data from .woff and .woff2 files. (no needed for .ttf files)
		wp_enqueue_script( 'inflate', plugin_dir_url( dirname( __FILE__ ) ) . 'js/lib/inflate.js', array(), '', false );
		wp_enqueue_script( 'unbrotli', plugin_dir_url( dirname( __FILE__ ) ) . 'js/lib/unbrotli.js', array(), '', false );

		Fonts_Page::load_fonts_react_app();

		?>
		<input id="nonce" type="hidden" value="<?php echo wp_create_nonce( 'create_block_theme' ); ?>" />
		<div id="fonts-app"></div>

		<?php
	}
}

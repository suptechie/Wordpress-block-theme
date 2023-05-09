<?php

require_once( __DIR__ . '/theme-tags.php' );

class Theme_Styles {
	/**
	 * Build a style.css file for CHILD/GRANDCHILD themes.
	 */
	public static function build_child_style_css( $theme ) {
		$slug        = $theme['slug'];
		$name        = stripslashes( $theme['name'] );
		$description = stripslashes( $theme['description'] );
		$uri         = $theme['uri'];
		$author      = stripslashes( $theme['author'] );
		$author_uri  = $theme['author_uri'];
		$wp_version  = get_bloginfo( 'version' );
		$template    = $theme['template'];
		$text_domain = $theme['text_domain'];
		$tags        = Theme_Tags::theme_tags_list( $theme );

		$style_css = "/*
Theme Name: {$name}
Theme URI: {$uri}
Author: {$author}
Author URI: {$author_uri}
Description: {$description}
Requires at least: 6.0
Tested up to: {$wp_version}
Requires PHP: 5.7
Version: 0.0.1
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
";

		if ( ! empty( $template ) ) {
			$style_css .= "Template: {$template}\n";
		}

		$style_css .= "Text Domain: {$text_domain}
Tags: {$tags}
*/";

		return $style_css;
	}

	public static function clear_user_styles_customizations() {
		// Clear all values in the user theme.json
		$user_custom_post_type_id = WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
		$global_styles_controller = new WP_REST_Global_Styles_Controller();
		$update_request           = new WP_REST_Request( 'PUT', '/wp/v2/global-styles/' );
		$update_request->set_param( 'id', $user_custom_post_type_id );
		$update_request->set_param( 'settings', array() );
		$update_request->set_param( 'styles', array() );
		$updated_global_styles = $global_styles_controller->update_item( $update_request );
		delete_transient( 'global_styles' );
		delete_transient( 'global_styles_' . get_stylesheet() );
		delete_transient( 'gutenberg_global_styles' );
		delete_transient( 'gutenberg_global_styles_' . get_stylesheet() );
	}
}

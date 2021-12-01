<?php

/**
 * Plugin Name: Create Blockbase theme.
 * Plugin URI: https://github.com/Automattic/create-blockbase-theme
 * Description: Generates a Blockbase child theme
 * Version: 0.0.1
 * Author: Automattic
 * Author URI: https://automattic.com/
 * License: GNU General Public License v2 or later
 * License URI: http://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: create-blockbase-theme
 */

/**
 * REST endpoint for exporting the contents of the Edit Site Page editor.
 *
 * @package gutenberg
 */


/*
	'Flatten' theme data that expresses both theme and user data.
	change property.[user|theme].value to property.value
	Uses user value if available, otherwise theme value
	I feel like there should be a function to do this in Gutenberg but I couldn't find it
*/
function flatten_theme_json( $data ) {
	if ( is_array( $data ) ) {

		if ( array_key_exists( 'user', $data ) ) {
			return $data['user'];
		}

		if ( array_key_exists( 'theme', $data ) ) {

			if ( array_key_exists( 'user', $data ) ) {
				return $data['user'];
			}

			return $data['theme'];
		}

		foreach( $data as $node_name => $node_value  ) {
			$data[ $node_name ] = flatten_theme_json( $node_value );
		}
	}

	return $data;
}

function gutenberg_edit_site_get_theme_json_for_export() {

	$base_theme = wp_get_theme()->get('TextDomain');
	$user_theme_json = WP_Theme_JSON_Resolver_Gutenberg::get_user_data();

	if ( $base_theme === 'blockbase' ) {
		return flatten_theme_json( $user_theme_json->get_raw_data() );
	}
}

function blockbase_get_style_css( $theme ) {
	$slug = $theme['slug'];
	$name = $theme['name'];
	$description = $theme['description'];
	$uri = $theme['uri'];
	$author = $theme['author'];
	$author_uri = $theme['author_uri'];

	return "/*
Theme Name: {$name}
Theme URI: {$uri}
Author: {$author}
Author URI: {$author_uri}
Description: {$description}
Requires at least: 5.8
Tested up to: 5.8
Requires PHP: 5.7
Version: 0.0.1
License: GNU General Public License v2 or later
License URI: https://raw.githubusercontent.com/Automattic/themes/trunk/LICENSE
Template: blockbase
Text Domain: {$slug}
Tags: one-column, custom-colors, custom-menu, custom-logo, editor-style, featured-images, full-site-editing, rtl-language-support, theme-options, threaded-comments, translation-ready, wide-blocks
*/";
}

function blockbase_get_readme_txt( $theme ) {
	$slug = $theme['slug'];
	$name = $theme['name'];
	$description = $theme['description'];
	$uri = $theme['uri'];
	$author = $theme['author'];
	$author_uri = $theme['author_uri'];

	return "=== {$name} ===
Contributors: {$author}
Requires at least: 5.8
Tested up to: 5.8
Requires PHP: 5.7
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

== Description ==

{$description}

== Changelog ==

= 1.0.0 =
* Initial release

== Copyright ==

{$name} WordPress Theme, (C) 2021 {$author}
{$name} is distributed under the terms of the GNU GPL.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.
";
}

/**
 * Creates an export of the current templates and
 * template parts from the site editor at the
 * specified path in a ZIP file.
 *
 * @param string $filename path of the ZIP file.
 */
function gutenberg_edit_site_export_theme_create_zip( $filename, $theme ) {

	$base_theme = wp_get_theme()->get('TextDomain');

	if ( ! class_exists( 'ZipArchive' ) ) {
		return new WP_Error( 'Zip Export not supported.' );
	}

	$zip = new ZipArchive();
	$zip->open( $filename, ZipArchive::OVERWRITE );
	$zip->addEmptyDir( $theme['slug'] );
	$zip->addEmptyDir( $theme['slug'] . '/block-templates' );
	$zip->addEmptyDir( $theme['slug'] . '/block-template-parts' );

	// Load templates into the zip file.
	$templates = gutenberg_get_block_templates();
	foreach ( $templates as $template ) {

		//Currently, when building against CHILD themes of Blockbase, block templates provided by Blockbase, not modified by the child theme or the user are included in the page. This is a bug.

		//if the theme is blockbase and the source is "theme" we don't want it
		if ($template->source === 'theme' && strpos($template->theme, 'blockbase') !== false) {
			continue;
		}

		// _remove_theme_attribute_in_block_template_content is provided by Gutenberg in the Site Editor's template export workflow.
		if ( function_exists( '_remove_theme_attribute_in_block_template_content' ) ) {
			$template->content = _remove_theme_attribute_in_block_template_content( $template->content );
		} else if ( function_exists( '_remove_theme_attribute_from_content' ) ) {
			$template->content = _remove_theme_attribute_from_content( $template->content );
		}
		$zip->addFromString(
			$theme['slug'] . '/block-templates/' . $template->slug . '.html',
			$template->content
		);
	}

	// Load template parts into the zip file.
	$template_parts = gutenberg_get_block_templates( array(), 'wp_template_part' );
	foreach ( $template_parts as $template_part ) {

		//Currently, when building against CHILD themes of Blockbase, block template parts provided by Blockbase, not modified by the child theme or the user are included in the page. This is a bug.
		//if the theme is blockbase and the source is "theme" we don't want it
		if ($template_part->source === 'theme' && strpos($template_part->theme, 'blockbase') !== false) {
			continue;
		}

		$zip->addFromString(
			$theme['slug'] . '/block-template-parts/' . $template_part->slug . '.html',
			$template_part->content
		);
	}

	// Add theme.json.

	// TODO only get child theme settings not the parent.
	$zip->addFromString(
		$theme['slug'] . '/theme.json',
		wp_json_encode( gutenberg_edit_site_get_theme_json_for_export(), JSON_PRETTY_PRINT )
	);

	// Add style.css.
	$zip->addFromString(
		$theme['slug'] . '/style.css',
		blockbase_get_style_css( $theme )
	);

	// Add theme.css combining all the current theme's css files.
	$zip->addFromString(
		$theme['slug'] . '/assets/theme.css',
		''
	);

	// Add readme.txt.
	$zip->addFromString(
		$theme['slug'] . '/readme.txt',
		blockbase_get_readme_txt( $theme )
	);

	// Add screenshot.png.
	$zip->addFile(
		__DIR__ . '/screenshot.png',
		$theme['slug'] . '/screenshot.png'
	);

	// Save changes to the zip file.
	$zip->close();
}

/**
 * Output a ZIP file with an export of the current templates
 * and template parts from the site editor, and close the connection.
 */
function gutenberg_edit_site_export_theme( $theme ) {
	// Sanitize inputs.
	$theme['name'] = sanitize_text_field( $theme['name'] );
	$theme['description'] = sanitize_text_field( $theme['description'] );
	$theme['uri'] = sanitize_text_field( $theme['uri'] );
	$theme['author'] = sanitize_text_field( $theme['author'] );
	$theme['author_uri'] = sanitize_text_field( $theme['author_uri'] );

	$theme['slug'] = sanitize_title( $theme['name'] );
	// Create ZIP file in the temporary directory.
	$filename = tempnam( get_temp_dir(), $theme['slug'] );
	gutenberg_edit_site_export_theme_create_zip( $filename, $theme );

	header( 'Content-Type: application/zip' );
	header( 'Content-Disposition: attachment; filename=' . $theme['slug'] . '.zip' );
	header( 'Content-Length: ' . filesize( $filename ) );
	flush();
	echo readfile( $filename );
	die();
}

// In Gutenberg a similar route is called from the frontend to export template parts
// I've left this in although we aren't using it at the moment, as I think eventually this will become part of Gutenberg.
add_action(
	'rest_api_init',
	function () {
		register_rest_route(
			'__experimental/edit-site/v1',
			'/create-theme',
			array(
				'methods'             => 'GET',
				'callback'            => 'gutenberg_edit_site_export_theme',
				'permission_callback' => function () {
					return current_user_can( 'edit_theme_options' );
				},
			)
		);
	}
);

function create_blockbase_theme_page() {
	?>
		<div class="wrap">
			<h2><?php _e('Create Blockbase Theme', 'create-blockbase-theme'); ?></h2>
			<p><?php _e('Save your current block templates and theme.json settings as a new theme.', 'create-blockbase-theme'); ?></p>
			<form method="get">
				<label><?php _e('Theme name', 'create-blockbase-theme'); ?><br /><input placeholder="<?php _e('Blockbase', 'create-blockbase-theme'); ?>" type="text" name="theme[name]" class="regular-text" required /></label><br /><br />
				<label><?php _e('Theme description', 'create-blockbase-theme'); ?><br /><textarea placeholder="<?php _e('Blockbase is a simple theme that supports full-site editing. Use it to build something beautiful.', 'create-blockbase-theme'); ?>" rows="4" cols="50" name="theme[description]" class="regular-text"></textarea></label><br /><br />
				<label><?php _e('Theme URI', 'create-blockbase-theme'); ?><br /><input placeholder="https://github.com/automattic/themes/tree/trunk/blockbase" type="text" name="theme[uri]" class="regular-text code" /></label><br /><br />
				<label><?php _e('Author', 'create-blockbase-theme'); ?><br /><input placeholder="<?php _e('Automattic', 'create-blockbase-theme'); ?>" type="text" name="theme[author]" class="regular-text" /></label><br /><br />
				<label><?php _e('Author URI', 'create-blockbase-theme'); ?><br /><input placeholder="<?php _e('https://automattic.com/', 'create-blockbase-theme'); ?>" type="text" name="theme[author_uri]" class="regular-text code" /></label><br /><br />
				<input type="hidden" name="page" value="create-blockbase-theme" />
				<input type="hidden" name="nonce" value="<?php echo wp_create_nonce( 'create_blockbase_theme' ); ?>" />
				<input type="submit" value="<?php _e('Create Blockbase theme', 'create-blockbase-theme'); ?>" class="button button-primary" />
			</form>
		</div>
	<?php
}
function blockbase_create_theme_menu() {
	$page_title=__('Create Blockbase Theme', 'create-blockbase-theme');
	$menu_title=__('Create Blockbase Theme', 'create-blockbase-theme');
	add_theme_page( $page_title, $menu_title, 'edit_theme_options', 'create-blockbase-theme', 'create_blockbase_theme_page' );
}

add_action( 'admin_menu', 'blockbase_create_theme_menu' );

function blockbase_save_theme() {
	// I can't work out how to call the API but this works for now.
	if ( ! empty( $_GET['page'] ) && $_GET['page'] === 'create-blockbase-theme' && ! empty( $_GET['theme'] ) ) {

		// Check user capabilities.
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return add_action( 'admin_notices', 'create_blockbase_child_admin_notice_error' );
		}

		// Check nonce
		if ( ! wp_verify_nonce( $_GET['nonce'], 'create_blockbase_theme' ) ) {
			return add_action( 'admin_notices', 'create_blockbase_child_admin_notice_error' );
		}

		if ( empty( $_GET['theme']['name'] ) ) {
			return add_action( 'admin_notices', 'create_blockbase_child_admin_notice_error' );
		}

		if ( wp_get_theme()->get( 'Name' ) !== 'Blockbase' ) {
			return add_action( 'admin_notices', 'create_blockbase_child_admin_notice_error_wrong_theme' );
		}

		add_action( 'admin_notices', 'create_blockbase_child_admin_notice_success' );
		gutenberg_edit_site_export_theme( $_GET['theme'] );
	}
}
add_action( 'admin_init', 'blockbase_save_theme');

function create_blockbase_child_admin_notice_error_wrong_theme() {
	$class = 'notice notice-error';
	$message = __( 'You can only create a Blockbase child theme from Blockbase. Please switch your theme to Blockbase.', 'create-blockbase-theme' );

	printf( '<div class="%1$s"><p>%2$s</p></div>', esc_attr( $class ), esc_html( $message ) );
}

function create_blockbase_child_admin_notice_error() {
	$class = 'notice notice-error';
	$message = __( 'Please specify a theme name.', 'create-blockbase-theme' );

	printf( '<div class="%1$s"><p>%2$s</p></div>', esc_attr( $class ), esc_html( $message ) );
}

function create_blockbase_child_admin_notice_success() {
	?>
		<div class="notice notice-success is-dismissible">
			<p><?php _e( 'New Blockbase child theme created!', 'create-blockbase-child' ); ?></p>
		</div>
	<?php
}

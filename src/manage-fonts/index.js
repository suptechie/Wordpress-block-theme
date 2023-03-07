import { useState, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import FontFamily from './font-family';
import {
	// eslint-disable-next-line
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import DemoTextInput from '../demo-text-input';
import FontsPageLayout from '../fonts-page-layout';
import './manage-fonts.css';
import HelpModal from './help-modal';
import FontsSidebar from '../fonts-sidebar';
import PageHeader from './page-header';
import { localFileAsThemeAssetUrl } from '../utils';

function ManageFonts() {
	const nonce = document.querySelector( '#nonce' ).value;

	// The element where the list of theme fonts is rendered coming from the server as JSON
	const themeFontsJsonElement = document.querySelector( '#theme-fonts-json' );

	// The form element that will be submitted to the server
	const manageFontsFormElement =
		document.querySelector( '#manage-fonts-form' );

	// The theme font list coming from the server as JSON
	const themeFontsJsonValue = themeFontsJsonElement.innerHTML;

	const themeFontsJson = JSON.parse( themeFontsJsonValue );

	// The client-side theme font list is initizaliased with the server-side theme font list
	const [ newThemeFonts, setNewThemeFonts ] = useState( themeFontsJson );

	// Object where we store the font family or font face index position in the newThemeFonts array that is about to be removed
	const [ fontToDelete, setFontToDelete ] = useState( {
		fontFamilyIndex: undefined,
		fontFaceIndex: undefined,
	} );

	// dialogs states
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );
	const [ isHelpOpen, setIsHelpOpen ] = useState( false );

	// When client side font list changes, we update the server side font list
	useEffect( () => {
		// Avoids running this effect on the first render
		if (
			fontToDelete.fontFamilyIndex !== undefined ||
			fontToDelete.fontFaceIndex !== undefined
		) {
			// Submit the form to the server
			manageFontsFormElement.submit();
		}
	}, [ newThemeFonts ] );

	const toggleIsHelpOpen = () => {
		setIsHelpOpen( ! isHelpOpen );
	};

	function requestDeleteConfirmation( fontFamilyIndex, fontFaceIndex ) {
		setFontToDelete(
			{ fontFamilyIndex, fontFaceIndex },
			setShowConfirmDialog( true )
		);
	}

	function confirmDelete() {
		setShowConfirmDialog( false );
		// if fontFaceIndex is undefined, we are deleting a font family
		if (
			fontToDelete.fontFamilyIndex !== undefined &&
			fontToDelete.fontFaceIndex !== undefined
		) {
			deleteFontFace(
				fontToDelete.fontFamilyIndex,
				fontToDelete.fontFaceIndex
			);
		} else {
			deleteFontFamily( fontToDelete.fontFamilyIndex );
		}
	}

	function cancelDelete() {
		setFontToDelete( {} );
		setShowConfirmDialog( false );
	}

	function deleteFontFamily( fontFamilyIndex ) {
		const updatedFonts = newThemeFonts.map( ( family, index ) => {
			if ( index === fontFamilyIndex ) {
				return {
					...family,
					shouldBeRemoved: true,
				};
			}
			return family;
		} );
		setNewThemeFonts( updatedFonts );
	}

	function deleteFontFace() {
		const { fontFamilyIndex, fontFaceIndex } = fontToDelete;
		const updatedFonts = newThemeFonts.reduce(
			( acc, fontFamily, index ) => {
				const { fontFace = [], ...updatedFontFamily } = fontFamily;

				if (
					fontFamilyIndex === index &&
					fontFace.filter( ( face ) => ! face.shouldBeRemoved )
						.length === 1
				) {
					updatedFontFamily.shouldBeRemoved = true;
				}

				updatedFontFamily.fontFace = fontFace.map( ( face, i ) => {
					if ( fontFamilyIndex === index && fontFaceIndex === i ) {
						return {
							...face,
							shouldBeRemoved: true,
						};
					}
					return face;
				} );
				return [ ...acc, updatedFontFamily ];
			},
			[]
		);
		setNewThemeFonts( updatedFonts );
	}

	const fontFamilyToDelete = newThemeFonts[ fontToDelete.fontFamilyIndex ];
	const fontFaceToDelete =
		newThemeFonts[ fontToDelete.fontFamilyIndex ]?.fontFace?.[
			fontToDelete.fontFaceIndex
		];

	const fontsOutline = newThemeFonts.reduce( ( acc, fontFamily ) => {
		acc[ fontFamily.fontFamily ] = {
			family: fontFamily.fontFamily,
			faces: fontFamily.fontFace.map( ( face ) => {
				return {
					weight: face.fontWeight,
					style: face.fontStyle,
					src: localFileAsThemeAssetUrl( face.src[ 0 ] ),
				};
			} ),
		};
		return acc;
	}, {} );

	return (
		<>
			<HelpModal isOpen={ isHelpOpen } onClose={ toggleIsHelpOpen } />

			<FontsPageLayout>
				<main>
					<PageHeader toggleIsHelpOpen={ toggleIsHelpOpen } />

					<ConfirmDialog
						isOpen={ showConfirmDialog }
						onConfirm={ confirmDelete }
						onCancel={ cancelDelete }
					>
						{ fontToDelete?.fontFamilyIndex !== undefined &&
						fontToDelete?.fontFaceIndex !== undefined ? (
							<h3>
								{ sprintf(
									// translators: %1$s: Font Style, %2$s: Font Weight, %3$s: Font Family
									__(
										`Are you sure you want to delete "%1$s - %2$s" variant of "%3$s" from your theme?`,
										'create-block-theme'
									),
									fontFaceToDelete?.fontStyle,
									fontFaceToDelete?.fontWeight,
									fontFamilyToDelete?.fontFamily
								) }
							</h3>
						) : (
							<h3>
								{ sprintf(
									// translators: %s: Font Family
									__(
										`Are you sure you want to delete "%s" from your theme?`,
										'create-block-theme'
									),
									fontFamilyToDelete?.fontFamily
								) }
							</h3>
						) }
						<p>
							{ __(
								'This action will delete the font definition and the font file assets from your theme.',
								'create-block-theme'
							) }
						</p>
					</ConfirmDialog>

					<DemoTextInput />

					<div className="font-families">
						{ newThemeFonts.map( ( fontFamily, i ) => (
							<FontFamily
								fontFamily={ fontFamily }
								fontFamilyIndex={ i }
								key={ `fontfamily${ i }` }
								deleteFontFamily={ requestDeleteConfirmation }
								deleteFontFace={ requestDeleteConfirmation }
							/>
						) ) }
					</div>

					<form method="POST" id="manage-fonts-form">
						<input
							type="hidden"
							name="new-theme-fonts-json"
							value={ JSON.stringify( newThemeFonts ) }
						/>
						<input type="hidden" name="nonce" value={ nonce } />
					</form>
				</main>

				<FontsSidebar
					title={ __( 'Theme Fonts', 'create-block-theme' ) }
					fontsOutline={ fontsOutline }
				/>
			</FontsPageLayout>
		</>
	);
}

export default ManageFonts;

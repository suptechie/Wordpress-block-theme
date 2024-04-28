import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import apiFetch from '@wordpress/api-fetch';
import {
	// eslint-disable-next-line
	__experimentalVStack as VStack,
	// eslint-disable-next-line
	__experimentalHeading as Heading,
	// eslint-disable-next-line
	__experimentalNavigatorToParentButton as NavigatorToParentButton,
	PanelBody,
	Button,
	CheckboxControl,
} from '@wordpress/components';
import { archive } from '@wordpress/icons';

import ScreenHeader from './screen-header';

export const SaveThemePanel = () => {
	const [ saveOptions, setSaveOptions ] = useState( {
		saveStyle: true,
		saveTemplates: true,
		processOnlySavedTemplates: true,
		saveFonts: true,
		removeNavRefs: false,
		localizeText: false,
		localizeImages: false,
	} );

	const { createErrorNotice } = useDispatch( noticesStore );

	const handleSaveClick = () => {
		apiFetch( {
			path: '/create-block-theme/v1/save',
			method: 'POST',
			data: saveOptions,
			headers: {
				'Content-Type': 'application/json',
			},
		} )
			.then( () => {
				// eslint-disable-next-line
				alert(
					__(
						'Theme saved successfully. The editor will now reload.',
						'create-block-theme'
					)
				);
				window.location.reload();
			} )
			.catch( ( error ) => {
				const errorMessage =
					error.message ||
					__(
						'An error occurred while attempting to save the theme.',
						'create-block-theme'
					);
				createErrorNotice( errorMessage, { type: 'snackbar' } );
			} );
	};

	return (
		<PanelBody>
			<ScreenHeader
				title={ __( 'Save Changes', 'create-block-theme' ) }
			/>
			<VStack>
				<CheckboxControl
					label="Save Fonts"
					help="Save activated fonts in the Font Library to the theme. Remove deactivated theme fonts from the theme."
					checked={ saveOptions.saveFonts }
					onChange={ () => {
						setSaveOptions( {
							...saveOptions,
							saveFonts: ! saveOptions.saveFonts,
						} );
					} }
				/>
				<CheckboxControl
					label="Save Style Changes"
					help="Save Global Styles values set in the Editor to the theme."
					checked={ saveOptions.saveStyle }
					onChange={ () => {
						setSaveOptions( {
							...saveOptions,
							saveStyle: ! saveOptions.saveStyle,
						} );
					} }
				/>
				<CheckboxControl
					label="Save Template Changes"
					help="Save Template and Template Part changes made in the Editor to the theme."
					checked={ saveOptions.saveTemplates }
					onChange={ () => {
						setSaveOptions( {
							...saveOptions,
							saveTemplates: ! saveOptions.saveTemplates,
						} );
					} }
				/>
				<CheckboxControl
					label="Process Only Modified Templates"
					help="Process only templates you have modified in the Editor. Any templates you have not modified will be left as is."
					disabled={ ! saveOptions.saveTemplates }
					checked={
						saveOptions.saveTemplates &&
						saveOptions.processOnlySavedTemplates
					}
					onChange={ () => {
						setSaveOptions( {
							...saveOptions,
							processOnlySavedTemplates:
								! saveOptions.processOnlySavedTemplates,
						} );
					} }
				/>
				<CheckboxControl
					label="Localize Text"
					help="Any text in a template will be copied to a pattern and localized."
					disabled={ ! saveOptions.saveTemplates }
					checked={
						saveOptions.saveTemplates && saveOptions.localizeText
					}
					onChange={ () => {
						setSaveOptions( {
							...saveOptions,
							localizeText: ! saveOptions.localizeText,
						} );
					} }
				/>
				<CheckboxControl
					label="Localize Images"
					help="Any images in a template will be copied to a local /assets folder and referenced from there via a pattern."
					disabled={ ! saveOptions.saveTemplates }
					checked={
						saveOptions.saveTemplates && saveOptions.localizeImages
					}
					onChange={ () => {
						setSaveOptions( {
							...saveOptions,
							localizeImages: ! saveOptions.localizeImages,
						} );
					} }
				/>
				<CheckboxControl
					label="Remove Navigation Refs"
					help="Remove Navigation Refs from the theme returning your navigation to the default state."
					disabled={ ! saveOptions.saveTemplates }
					checked={
						saveOptions.saveTemplates && saveOptions.removeNavRefs
					}
					onChange={ () => {
						setSaveOptions( {
							...saveOptions,
							removeNavRefs: ! saveOptions.removeNavRefs,
						} );
					} }
				/>
				<Button
					variant="primary"
					icon={ archive }
					onClick={ handleSaveClick }
				>
					{ __( 'Save Changes', 'create-block-theme' ) }
				</Button>
			</VStack>
		</PanelBody>
	);
};

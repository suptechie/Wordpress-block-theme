import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

import FontVariant from './font-variant';
import googleFontsData from "../../assets/google-fonts/fallback-fonts-list.json";
import { getWeightFromGoogleVariant, getStyleFromGoogleVariant, forceHttps } from './utils';

const EMPTY_SELECTION_DATA = JSON.stringify( {} );

function GoogleFonts () {
    const [ selectedFont, setSelectedFont ] = useState( null );
    const [ selectedVariants, setSelectedVariants ] = useState( [] );
    const [ selectionData, setSelectionData ] = useState( EMPTY_SELECTION_DATA );

    // pickup the nonce from the input printed in the server
    const nonce = document.querySelector( "#nonce" ).value;

    const handleToggleAllVariants = () => {
        if ( !selectedVariants.length ) {
            setSelectedVariants( selectedFont.variants );
        } else {
            setSelectedVariants( [] );
        }
    }

    const handleToggleVariant = ( variant ) => {
        if ( selectedVariants.includes( variant ) ) {
            setSelectedVariants( selectedVariants.filter( ( v ) => v !== variant ) );
        } else {
            setSelectedVariants( [ ...selectedVariants, variant ] );
        }
    }

    // Reset selected variants when the selected font changes
    useEffect( () => {
        setSelectedVariants( [] );
        setSelectionData( EMPTY_SELECTION_DATA );
    }, [ selectedFont ] );

    // Update selection data when selected variants change
    useEffect( () => {
        if ( selectedFont && selectedVariants.length ) {
            const faces = selectedVariants.map( ( variant ) => {
                return {
                    style: getStyleFromGoogleVariant( variant ),
                    weight: getWeightFromGoogleVariant( variant ),
                    src: forceHttps( selectedFont.files[ variant ] ),
                }
            });
            const newSelectionData = {
                family: selectedFont.family,
                faces: faces,
            };
            setSelectionData( JSON.stringify( newSelectionData ) );
        } else {
            setSelectionData( EMPTY_SELECTION_DATA );
        }
    }, [ selectedVariants ] );


    const theme = useSelect( ( select ) => {
        return select( coreDataStore ).getCurrentTheme();
    }, null );

    const handleSelectChange = ( event ) => {
        setSelectedFont( googleFontsData.items[ event.target.value ] ) ;
    }

    return (
        <div className="wrap google-fonts-page">
			<h2>{ __('Add Google fonts to your theme', 'create-block-theme') }</h2>
            <h3>{ __('Add Google fonts assets and font face definitions to your currently active theme', 'create-block-theme')} ({ theme?.name.rendered })</h3>


            <form enctype="multipart/form-data" action="" method="POST">
                <label for="google-font-id">{ __('Select Font', 'create-block-theme') }</label>

                <select name="google-font" onChange={ handleSelectChange }>
                    <option value={null}>{ __('Select a font...', 'create-block-theme') }</option>
                    { googleFontsData.items.map( ( font, index ) => (
                            <option value={ index }>{ font.family }</option>
                    ))}
                </select>

                <br /><br />
                <p className="hint">{ __('Select the font variants you want to include:', 'create-block-theme') }</p>

                { selectedFont && (
                    <table className="wp-list-table widefat striped table-view-list" id="google-fonts-table">
                        <thead>
                            <tr>
                                <td className="">
                                    <input
                                        type="checkbox"
                                        onClick={ handleToggleAllVariants }
                                        checked={ selectedVariants.length === selectedFont?.variants.length }
                                    />
                                </td>
                                <td className="">{ __('Weight', 'create-block-theme') }</td>
                                <td className="">{ __('Style', 'create-block-theme') }</td>
                                <td className="">{ __('Preview', 'create-block-theme') }</td>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedFont.variants.map( ( variant, i ) => (
                                <FontVariant
                                    font={ selectedFont }
                                    variant={ variant }
                                    key={`font-variant-${i}`}
                                    isSelected={ selectedVariants.includes( variant ) }
                                    handleToggle={ () => handleToggleVariant( variant ) }
                                />
                            ))}
                        </tbody>
                    </table>
                ) }

                <br /><br />

                <input type="hidden" name="selection-data" value={ selectionData } />

                <input
                    type="submit"
                    value={ __('Add google fonts to your theme', 'create-block-theme') }
                    className="button button-primary"
                    disabled={ selectedVariants.length === 0 }
                />

                <input type="hidden" name="nonce" value={ nonce } />
            </form>
		</div>
    )
}

export default GoogleFonts;

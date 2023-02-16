// Toggles the visibility of the forms based on the selected theme type
// eslint-disable-next-line no-unused-vars
function toggleForm( element ) {
	if ( ! element?.value ) return;
	const themeType = element.value;
	hideAllForms();

	switch ( themeType ) {
		case 'export':
		case 'save':
			// Forms should stay hidden
			break;

		case 'child':
		case 'clone':
		case 'blank':
			// Show New Theme form
			document
				.getElementById( 'new_theme_metadata_form' )
				.toggleAttribute( 'hidden', false );

			resetThemeTags( element.value );
			validateThemeTags( 'subject' );
			break;

		case 'variation':
			// Show Variation form
			document
				.getElementById( 'new_variation_metadata_form' )
				.toggleAttribute( 'hidden', false );
			break;

		default:
			break;
	}
}

function hideAllForms() {
	const allForms = document.querySelectorAll( '.theme-form' );
	allForms.forEach( ( form ) => {
		form.toggleAttribute( 'hidden', true );
	} );
}

// Handle theme tag validation
function validateThemeTags( tagCategory ) {
	if ( ! tagCategory ) return;
	let checkboxes;

	if ( 'subject' === tagCategory ) {
		checkboxes = 'input[name="theme[tags-subject][]"]';
	}

	limitCheckboxSelection( checkboxes, 3 );
}

// Takes a checkbox selector and limits the number of checkboxes that can be selected
function limitCheckboxSelection( checkboxesSelector, max = 0 ) {
	if ( ! checkboxesSelector ) return;

	const allCheckboxes = document.querySelectorAll( checkboxesSelector );
	const checked = document.querySelectorAll(
		`${ checkboxesSelector }:checked`
	);
	const unchecked = document.querySelectorAll(
		`${ checkboxesSelector }:not(:checked)`
	);

	if ( checked.length >= max ) {
		for ( let j = 0; j < unchecked.length; j++ ) {
			unchecked[ j ].setAttribute( 'disabled', true );
		}
	}

	if ( checked.length < max ) {
		for ( let j = 0; j < unchecked.length; j++ ) {
			unchecked[ j ].removeAttribute( 'disabled' );
		}
	}

	for ( let i = 0; i < allCheckboxes.length; i++ ) {
		allCheckboxes[ i ].addEventListener( 'change', function () {
			limitCheckboxSelection( checkboxesSelector, max );
		} );
	}
}

// Store active theme tags when page is loaded
let activeThemeTags = [];
window.onload = () => {
	activeThemeTags = document.querySelectorAll(
		'.theme-tags input[type="checkbox"]:checked'
	);
};

// Resets all theme tag states (checked, disabled) to default values
function resetThemeTags( themeType ) {
	// Clear all checkboxes
	const allCheckboxes = document.querySelectorAll(
		'.theme-tags input[type="checkbox"]'
	);
	allCheckboxes.forEach( ( checkbox ) => {
		checkbox.checked = false;
		checkbox.removeAttribute( 'disabled' );
	} );

	// Recheck default tags
	const defaultTags = document.querySelectorAll(
		'.theme-tags input[type="checkbox"].default-tag'
	);
	defaultTags.forEach( ( checkbox ) => {
		checkbox.checked = true;
	} );

	if ( 'blank' !== themeType ) {
		// Recheck active theme tags
		if ( ! activeThemeTags ) return;

		activeThemeTags.forEach( ( checkbox ) => {
			checkbox.checked = true;
		} );
	}
}

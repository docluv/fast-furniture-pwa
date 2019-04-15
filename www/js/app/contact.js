//On user interaction

var btn = document.querySelector( ".btn-contact-submit" );

btn.addEventListener( "click", function ( event ) {
	event.preventDefault();

	submitPage( document.getElementById( "contact-form-with-recaptcha" ) );

	return false;

} );


function submitValidation( form ) {

	var state = form.checkValidity();

	// if ( !state ) {

	// 	focusOnFirstInvalid( form );
	// }

	return state;

}

function submitPage( form ) {

	if ( !form ) {
		return;
	}

	if ( submitValidation( form ) ) {

		//			var fd = new FormData( form );

		console.log( "contact submitted" );


	}

}


/*

fetch("https://7g46i3t1el.execute-api.us-east-1.amazonaws.com/demo/contact", {
	method: "POST", 
	mode: "cors", 
	redirect: "follow",
	headers: new Headers({
		"Content-Type": "application/json"
	}),
	body: JSON.stringify({
		"email": "contactor@gmail.com",
		"answer": "hello world"
	})
}).then(function(response) { 

    // handle response

	response.json().then(function(data){

	    console.log(data);

	});

});

*/
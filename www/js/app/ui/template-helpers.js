function fetchAndRenderTemplate( src, data ) {

    return fetchTemplate( {
            src: src
        } )
        .then( function ( template ) {

            return renderTemplate( template, data );

        } );

}

function renderTemplate( html, data ) {

    return Mustache.render( html, data );

}

function fetchTemplate( options ) {

    return fetch( options.src, options )
        .then( function ( response ) {

            return response.text();

        } );

}
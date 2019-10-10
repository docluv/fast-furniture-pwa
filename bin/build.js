const utils = require( "./utils" ),
    products = require( "./products" ),
    categories = require( "./categories" ),
    fs = require( "fs" ),
    path = require( "path" ),
    glob = require( "glob" ),
    ncp = require( "ncp" ),
    template = require( "mustache" ),
    utf8 = "utf-8",
    defaultPage = utils.readJSON( "default.page.json", utf8 ),
    appShell = fs.readFileSync( "../www/src/html/app/shell.html", utf8 );


function renderPages() {

    let target = "../dist/";

    glob( "../site/src/pages/**/*.json", function ( er, files ) {

        for ( let i = 0; i < files.length; i++ ) {

            let json = utils.readJSON( files[ i ] );

            let html = template.render( appShell, json );

            //need to create the real path here
            utils.createFile( target + json.slug + "/index.html", html, true );

        }

    } );

}


return Promise.all( [
        categories.buildCategoryPages( defaultPage ),
        products.buildProductPages( defaultPage )
    ] ).then( renderPages )
    .catch( err => {

        console.error( err );

    } );
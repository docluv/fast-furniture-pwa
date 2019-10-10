const fs = require( 'fs' );
const path = require( 'path' );
const glob = require( 'glob' );
const CleanCSS = require( 'clean-css' );
const revHash = require( 'rev-hash' );
const utils = require( "./utils" );
const minifier = new CleanCSS( {} );

function createHashedName( fileName, hash ) {

    let newFileName = fileName.replace( "src/", "www/localhost/" );
    let ext = path.extname( newFileName );

    return newFileName.replace( ext, "." + hash + ext );

}


glob( "../www/**/*.css", function ( er, files ) {

    for ( let i = 0; i < files.length; i++ ) {

        let content = fs.readFileSync( files[ i ] );

        if ( content && content !== "" ) {

            let output = minifier.minify( content );

            let hashName = revHash( output.styles );
            //content); //
            //            console.log(createHashedName(files[i], hashName));

            utils.MakeDirectory( path.dirname( hashName ) );

            utils.copyFileSync( files[ i ], createHashedName( files[ i ], hashName ), true );

        }

    }

} );
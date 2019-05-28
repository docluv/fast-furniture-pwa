const fs = require( "fs" ),
    path = require( "path" ),
    faker = require( "faker" ),
    utils = require( "./utils" ),
    photoSrc = "../www/images/display",
    photoFolders = [ "originals", "display", "thumb", "mobile" ],
    utf8 = "utf-8";

//read content/article
let db = fs.readFileSync( path.resolve( "../api/db.json" ), utf8 );
db = JSON.parse( db );


var srcPhotos = [],
    products = [];


const categories = [];

/* for local 'franchise' list to display on map */
/* The demo actually generates the values on the fly based on location */
function generateStores() {

    let ret = [];

    //fake accounts
    for ( count = 0; count < faker.random.number( 24 ); count++ ) {

        ret.push( makeStore() );

    }

    return ret;

}


function makeStore() {

    return {
        "id": faker.random.uuid(),
        "name": faker.company.companyName(),
        "lastUpdated": faker.date.past(),
        "createdBy": faker.internet.userName(),
        "updatedBy": faker.internet.userName(),
        "archive": faker.random.boolean()
    };

}

db.stores = generateStores();

fs.writeFileSync( path.resolve( "../api/db.json" ), JSON.stringify( db ), utf8 );

class FastFurnitureData {

    constructor() {

        loadCategorySource();
        loadSourceImages();

    }

    buildCategories() {}

    buildCategory( name ) {}

    buildProduct() {

        let photo = this.getRandomPhoto(),
            name = faker.commerce.productName();

        return {
            "Id": faker.random.uuid(),
            "Name": name,
            "Slug": utils.makeSlug( name ),
            "Description": this.getProductDescription(),
            "Photos": {
                "Original": photo,
                "Display": photo,
                "Mobile": photo,
                "Thumb": photo
            },
            "Price": faker.commerce.price(),
            "Categories": this.getProductCategories(),
            "Related": [],
            "Reviews": this.getProductReviews(),
            "AvgRating": faker.random.number( {
                min: 1,
                max: 5
            } )
        };

    }

    loadSourceImages() {

        fs.readdirSync( photoSrc ).forEach( file => {
            srcPhotos.push( path.basename( file ) );
        } );

    }

    loadCategorySource() {

        categories = utils.readJSON( "categories.src.json" );

    }

    getRandomPhoto() {

        let index = faker.random.number( srcPhotos.length - 1 );

        let photo = srcPhotos[ index ];

        return {
            "Name": category.Name,
            "Slug": category.Slug
        };

    }

    getProductDescription() {

        let paras = faker.lorem.paragraphs( faker.random.number( {
            min: 1,
            max: 5
        } ) );

        return paras.split( "\n" );

    }

    getProductReviews() {

        let total = faker.random.number( {
            min: 1,
            max: 5
        } );

        let reviews = [];

        for ( let i = 0; i < total; i++ ) {

            let paras = faker.lorem.paragraphs( faker.random.number( {
                min: 1,
                max: 5
            } ) );

            paras = paras.split( "\n" );

            reviews.push( paras );
        }


        return reviews;
    }

    getProductCategories() {

        let total = faker.random.number( {
            min: 2,
            max: 5
        } );

        let categories = [];

        for ( let i = 0; i < total; i++ ) {

            categories.push( this.getRandomCategory() );

        }

        return categories;

    }

    getRandomCategory() {

        let index = faker.random.number( categories.length - 1 );

        let category = categories[ index ];

        return {
            "Name": category.Name,
            "Slug": category.Slug
        };

    }

    generateRelateProducts( product ) {


    }

    buildProducts() {

        let total = categories.length * 10;

        for ( let i = 0; i < total - 1; i++ ) {

            products.push( buildProduct() );

        }

        return;

    }

};
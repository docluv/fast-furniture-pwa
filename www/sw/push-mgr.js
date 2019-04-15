class PushManager {

    constructor() {

        this.registerPush();

    }

    registerPush() {

        var pm = this;

        self.addEventListener( "push", event => {

            pm.handlePush( event );

        } );

        pm.registerResponse();

    }

    handlePush( event ) {

        console.log( '[Service Worker] Push Received.' );
        console.log( '[Service Worker] Data: ', event.data );
        console.log( `[Service Worker] Push had this data: "${event.data.text()}"` );

        try {

            const data = event.data.json(),
                msg = JSON.parse( data.message );

            event.waitUntil( self.registration
                .showNotification( data.title, msg ) );

        } catch ( e ) {
            console.log( 'invalid json - notification supressed' );
        }

    }

    registerResponse() {

        var that = this;

        self.addEventListener( 'notificationclick', event => {

            that.handleResponse( event );

        } );

    }


    handleResponse( event ) {

        console.log( '[Service Worker] Notification click Received. ${event}' );

        if ( event.action && validURL( event.action ) ) {

            clients.openWindow( event.action );

        }

        event.notification.close();

    }

    validURL( str ) {
        var pattern = new RegExp( '^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i' ); // fragment locator
        return !!pattern.test( str );
    }

}
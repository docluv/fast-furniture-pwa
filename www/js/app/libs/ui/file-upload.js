( function (window) {

    /*
        - handle photo preview
        - handle upload to API
        - handle accept/retake
        - handle file input events
        - own camera object

    */

    var defaults = {
            srcSelector: "#file-to-upload",
            previewSelector: ".image-upload-preview",
            previewRowSelector: ".file-upload-preview",
            retakePhoto: ".btn-retake-photo",
            btnUsePhoto: ".btn-use-photo",
            btnRetake: ".btn-retake-photo",
            photoComment: ".photoComment",
            instructionCanvas: ".instruction-canvas",
            attachmentPanel: ".attachment-panel",
            uploadWrapper: ".upload-photo-wrapper",
            cameraWrapper: ".capture-photo-wrapper",
            selectPhotoCallback: function () {},
            extensions: "",
            fileSize: 100000,
            apiTarget: "",
            attributes: {}
        },
        config,
        $fileSrc,
        $btnUsePhoto,
        $btnRetake,
        $imagePreview,
        $imagePreviewRow,
        $photoComment,
        $instructionCanvas,
        $cameraPanel,
        $fileUploadPanel,
        $attachmentPanel,
        $btnUploadPhoto,
        $cameraCanvas,
        $camera,
        srcBlob;

    function fileupload( options ) {

        options = options || {};

        config = Object.assign( {}, defaults, options );

        $fileSrc = $( config.srcSelector );
        $imagePreview = $( config.previewSelector );
        $imagePreviewRow = $( config.previewRowSelector );
        $photoComment = $(config.photoComment);

        $attachmentPanel = $(config.attachmentPanel);
        $instructionCanvas = $(config.instructionCanvas);

        $btnUsePhoto = $(config.btnUsePhoto);
        $btnRetake = $(config.btnRetake);

        $cameraPanel = $(config.cameraWrapper);
        $fileUploadPanel = $(config.uploadWrapper);

        $btnUploadPhoto = $( ".btn-upload-photo");

        bindEvents();

        $camera = window.camera( {
            previewPhoto:previewCameraPhoto
        } );

        return {
            show: showFileUpload,
            hide: hideFileUpload
        };

    }

    function previewCameraPhoto($canvas){

        if($canvas){

            $cameraCanvas = $canvas;

            $cameraCanvas.toBlob( function ( blob ) {

                srcBlob = blob;

                setPhotoPreview(blob);

            }, "image/jpeg");

        }

    }

    function showFileUpload(){

        $attachmentPanel.addClass( "d-flex" ).removeClass( "d-none" );
        $instructionCanvas.addClass( "d-flex" ).removeClass( "d-none" );

    }

    function hideFileUpload(){

        $attachmentPanel.removeClass( "d-flex" ).addClass( "d-none" );
        $instructionCanvas.removeClass( "d-flex" ).addClass( "d-none" );

    }

    function bindEvents() {

        $fileSrc.on( "change", handleFileChange );
        $btnUsePhoto.on( "click", handleFileUpload );
        $btnRetake.on( "click", changePhoto );

        $( ".btn-toggle-to-upload" ).on( "click", function ( e ) {

            showUploadUI();

        } );

        $( ".btn-capture-photo" ).on( "click", function ( e ) {
            showCameraUI();
        } );

        $btnUploadPhoto.on("click", function(e){

            e.preventDefault();

            $fileUploadPanel.addClass("d-flex");
            $btnUploadPhoto.addClass("d-none");

            return false;
        });

        $(".btn-upload-confirm-close").on("click", function(e){

            e.preventDefault();

            $fileUploadPanel.addClass("d-flex");
            $(".file-upload-confirm").removeClass("d-flex");

            hideUploadUI();

            return false;
        });
    }

    function showUploadUI(){

        $cameraPanel.removeClass("d-flex");
        $fileUploadPanel.addClass("d-flex");

        $(".file-upload-btn-wrapper").addClass("d-flex");

    }

    function hideUploadUI(){

        $(".attachment-panel").removeClass("d-flex");

    }

    function showCameraUI(){

        $fileUploadPanel.removeClass("d-flex");
        $cameraPanel.addClass("d-flex");

        $camera.display();

    }

    function changePhoto(e){

        e.preventDefault();

        $instructionCanvas.addClass("d-flex");
        $fileUploadPanel.addClass("d-flex");
        $(".upload-preview-instructions").removeClass("d-flex");
        $imagePreviewRow.removeClass("d-flex");

        return false;
    }

    function handleFileChange( e ) {

        e.preventDefault();

        if ( $fileSrc[ 0 ].files.length === 0 ) {
            return;
        }

        let file = $fileSrc[ 0 ].files[ 0 ];

        if ( file ) {

            if ( file.size > 9900000 ) {

                alert( "too large" );
                return false;
            }

            uploaded_image = file;

            srcBlob = file;

            setPhotoPreview(file);
        }

    }

    function setPhotoPreview(src){

        let img = new Image();

        img.src = window.URL.createObjectURL( src );
        $imagePreview[ 0 ].src = window.URL.createObjectURL( src );

        img.onload = function () {

            return previewPhoto( img );

        };

    }

    function previewPhoto( img ) {

        $instructionCanvas.removeClass("d-flex");
        $fileUploadPanel.removeClass("d-flex");
        $(".upload-preview-instructions").addClass("d-flex");

        width = img.naturalWidth;
        height = img.naturalHeight;

      //  window.URL.revokeObjectURL( img.src );

        $imagePreviewRow.addClass("d-flex").removeClass("d-none");

    }

    function handleFileUpload(e){

        e.preventDefault();

        if(srcBlob){

            uploadFile( srcBlob )
                .then(function(result){

                    showConfirmation();

                    document.body.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                        inline: "nearest"
                    });

                    config.selectPhotoCallback(Object.assign({}, result, {
                        imgSrc: srcBlob
                    }));


                });

        }else{

            console.log("no source blob");
            return;

        }

    }

    function showConfirmation(){

        $(".file-upload-confirm").addClass("d-flex");
        $(".file-upload-preview").removeClass("d-flex");
        $(".upload-preview-instructions").removeClass("d-flex");
                
    }

    function uploadFile( blob ) {

        var formData = new FormData();

        formData.append( "srcPhoto", blob); //, "test.jpg" );
        formData.append("attributes", JSON.stringify(config.attributes));
        formData.append("PhotoComment", $photoComment.value() || "" );

        return love2dev.http.post( {
            authorized: true,
            url: config.apiTarget,
            ContentType: "multipart/form-data",
            body: formData
        } )
        .then( function ( response ) {

            if ( response.ok ) {

                return response.json();

            } else {
                throw {
                    "message": "failed to upload new image"
                };
            }

        } ).catch( function ( error ) {

            $imagePreviewRow.addClass( "d-none" );
            //TODO: trigger some form of nice message here
            console.log( "Problem uploading icon source: ", error );
            return false;

        } );

    }

    window.fileupload = fileupload;

} )(this);
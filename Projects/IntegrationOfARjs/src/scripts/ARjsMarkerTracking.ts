import { Behaviour } from "@needle-tools/engine/engine-components/Component";
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
import { serializeable } from "@needle-tools/engine";
import { Group, Object3D } from "three";

export class ARTest extends Behaviour {

    arToolkitSource : THREEx.ArToolkitSource;
    arToolkitContext : THREEx.ArToolkitContext;
    arMarkerControls : THREEx.ArMarkerControls;

    @serializeable(Object3D)
    trackableGameObject: Object3D | null = null;

    start() {  
        this.arToolkitSource = new THREEx.ArToolkitSource({
			// to read from the webcam
			sourceType: 'webcam',

			//sourceWidth: window.innerWidth > window.innerHeight ? 640 : 480,
			//sourceHeight: window.innerWidth > window.innerHeight ? 480 : 640,

			// // to read from an image
			// sourceType : 'image',
			// sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/images/img.jpg',

			// to read from a video
			// sourceType : 'video',
			// sourceUrl : THREEx.ArToolkitContext.baseURL + '../data/videos/headtracking.mp4',
		})

        this.arToolkitSource.init(() => {
            this.arToolkitSource.domElement.addEventListener('canplay', () => {
                console.log(
                    'canplay',
                    'actual source dimensions',
                    this.arToolkitSource.domElement.videoWidth,
                    this.arToolkitSource.domElement.videoHeight
                );
    
                this.initARContext();
                this.onResize();
            });
        });

        // handle resize
		window.addEventListener('resize', () => {
			this.onResize();
		});
    }

    update() {
        if (!this.arToolkitContext || !this.arToolkitSource || !this.arToolkitSource.ready) {
            return;
        }

        this.arToolkitContext.update(this.arToolkitSource.domElement);
    }

    initARContext() {
        // CONTEXT
        this.arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: THREEx.ArToolkitContext.baseURL + '../data/data/camera_para.dat',
            detectionMode: 'mono'
        });

        this.arToolkitContext.init(() => {
            this.context.mainCamera?.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix());
            
            this.arToolkitContext.arController.orientation = this.getSourceOrientation();
            this.arToolkitContext.arController.options.orientation = this.getSourceOrientation();
        });

        // MARKER
        var markerGroup = new Group();
        this.context.scene.add(markerGroup);
        this.arMarkerControls = new THREEx.ArMarkerControls(this.arToolkitContext, markerGroup, {
            // type of marker - ['pattern', 'barcode', 'unknown' ]
            type: 'pattern',
            // url of the pattern - IIF type='pattern'
            patternUrl: THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro',
            // turn on/off camera smoothing
            smooth: true,
            // number of matrices to smooth tracking over, more = smoother but slower follow
            smoothCount: 5,
            // distance tolerance for smoothing, if smoothThreshold # of matrices are under tolerance, tracking will stay still
            smoothTolerance: 0.01,
            // threshold for smoothing, will keep still unless enough matrices are over tolerance
            smoothThreshold: 2
        });
        
        // add reference Unity gameObject
        if (this.trackableGameObject) {
            markerGroup.add(this.trackableGameObject);
        }

        // add THREE object via three.js
        // var geometry	= new BoxGeometry(1,1,1);
        // var material	= new MeshNormalMaterial({
        //     transparent : true,
        //     opacity: 0.5,
        //     side: DoubleSide
        // });
        // var mesh = new Mesh( geometry, material );
        // mesh.position.y	= geometry.parameters.height/2
        // markerGroup.add(mesh);
    }

    getSourceOrientation() {
        if (!this.arToolkitSource) {
            return null;
        }

        console.log(
            'actual source dimensions',
            this.arToolkitSource.domElement.videoWidth,
            this.arToolkitSource.domElement.videoHeight
        );

        if (this.arToolkitSource.domElement.videoWidth > this.arToolkitSource.domElement.videoHeight) {
            console.log('source orientation', 'landscape');
            return 'landscape';
        } else {
            console.log('source orientation', 'portrait');
            return 'portrait';
        }
    }

    onResize() {
		this.arToolkitSource.onResizeElement();
        this.arToolkitSource.copyElementSizeTo(this.context.renderer.domElement);
        if (this.arToolkitContext.arController !== null && this.arToolkitContext.arController.canvas != null) {
            this.arToolkitSource.copyElementSizeTo(this.arToolkitContext.arController.canvas);
        }
	}
}
import { Behaviour, GameObject } from "@needle-tools/engine/engine-components/Component";
import * as THREE from "three";
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex.js";
import { serializeable } from "@needle-tools/engine";

export class ARTest extends Behaviour {

    arToolkitSource : THREEx.ArToolkitSource;
    arToolkitContext : THREEx.ArToolkitContext;
    arMarkerControls : THREEx.ArMarkerControls;

    @serializeable(GameObject)
    trackableGameObject: GameObject | null = null;

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
        var markerGroup = new THREE.Group();
        this.context.scene.add(markerGroup);
        this.arMarkerControls = new THREEx.ArMarkerControls(this.arToolkitContext, markerGroup, {
            type: 'pattern',
            patternUrl: THREEx.ArToolkitContext.baseURL + '../data/data/patt.hiro',
        });
        
        // add reference Unity gameObject
        if (this.trackableGameObject) {
            markerGroup.add(this.trackableGameObject);
        }

        // add THREE object
        var geometry	= new THREE.BoxGeometry(1,1,1);
        var material	= new THREE.MeshNormalMaterial({
            transparent : true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.y	= geometry.parameters.height/2
        markerGroup.add(mesh);
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
        if (this.arToolkitContext.arController !== null) {
            this.arToolkitSource.copyElementSizeTo(this.arToolkitContext.arController.canvas);
        }
	}
}
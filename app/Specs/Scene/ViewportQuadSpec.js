/*global defineSuite*/
defineSuite([
        'Scene/ViewportQuad',
        'Core/BoundingRectangle',
        'Core/Color',
        'Core/loadImage',
        'Renderer/ClearCommand',
        'Renderer/Texture',
        'Scene/Material',
        'Specs/createScene',
        'Specs/pollToPromise'
    ], function(
        ViewportQuad,
        BoundingRectangle,
        Color,
        loadImage,
        ClearCommand,
        Texture,
        Material,
        createScene,
        pollToPromise) {
    "use strict";
    /*global jasmine,describe,xdescribe,it,xit,expect,beforeEach,afterEach,beforeAll,afterAll,spyOn*/

    var scene;
    var viewportQuad;
    var testImage;

    beforeAll(function() {
        scene = createScene();
        return loadImage('./Data/Images/Red16x16.png').then(function(image) {
            testImage = image;
        });
    });

    afterAll(function() {
        scene.destroyForSpecs();
    });

    beforeEach(function() {
        viewportQuad = new ViewportQuad();
        viewportQuad.rectangle = new BoundingRectangle(0, 0, 2, 2);
    });

    afterEach(function() {
        scene.primitives.removeAll();
    });

    it('constructs with a rectangle', function() {
        var rectangle = new BoundingRectangle(1.0, 2.0, 3.0, 4.0);
        var quad = new ViewportQuad(rectangle);
        expect(quad.rectangle).toEqual(rectangle);
    });

    it('constructs with a material', function() {
        var material = Material.fromType(Material.StripeType);
        var quad = new ViewportQuad(undefined, material);
        expect(quad.material.type).toEqual(material.type);
    });

    it('gets the default color', function() {
        expect(viewportQuad.material.uniforms.color).toEqual(
            new Color(1.0, 1.0, 1.0, 1.0));
    });

    it('throws when rendered without a rectangle', function() {
        viewportQuad.rectangle = undefined;
        scene.primitives.add(viewportQuad);

        expect(function() {
            scene.renderForSpecs();
        }).toThrowDeveloperError();
    });

    it('throws when rendered without a material', function() {
        viewportQuad.material = undefined;
        scene.primitives.add(viewportQuad);

        expect(function() {
            scene.renderForSpecs();
        }).toThrowDeveloperError();
    });

    it('does not render when show is false', function() {
        viewportQuad.show = false;
        expect(scene.renderForSpecs()).toEqual([0, 0, 0, 255]);
        scene.primitives.add(viewportQuad);
        expect(scene.renderForSpecs()).toEqual([0, 0, 0, 255]);
    });

    it('renders material', function() {
        expect(scene.renderForSpecs()).toEqual([0, 0, 0, 255]);
        scene.primitives.add(viewportQuad);
        expect(scene.renderForSpecs()).not.toEqual([0, 0, 0, 255]);
    });

    it('renders user created texture', function() {
        var texture = new Texture({
            context : scene.context,
            source : testImage
        });

        viewportQuad.material = Material.fromType(Material.ImageType);
        viewportQuad.material.uniforms.image = texture;

        pollToPromise(function() {
            return viewportQuad.material._loadedImages.length !== 0;
        }).then(function() {
            expect(scene.renderForSpecs()).toEqual([0, 0, 0, 255]);
            scene.primitives.add(viewportQuad);
            expect(scene.renderForSpecs()).toEqual([255, 0, 0, 255]);
        });
    });

    it('isDestroyed', function() {
        var boundRectangle = new BoundingRectangle(0, 0, 10, 10);
        var vq = new ViewportQuad(boundRectangle);

        expect(vq.isDestroyed()).toEqual(false);
        vq.destroy();
        expect(vq.isDestroyed()).toEqual(true);
    });
}, 'WebGL');

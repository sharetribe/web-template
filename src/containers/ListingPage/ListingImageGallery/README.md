# ListingImageGallery

This component takes in listing images and image variants config to render a responsive image
gallery. It uses [react-image-gallery](https://github.com/xiaolin/react-image-gallery) for the
functionality and interactions, but renders the images using the `ResponsiveImage` component.

**NOTE:** the `image-gallery.css` file in this directory is copied from
`node_modules/react-image-gallery/styles/css/image-gallery.css`. That file should be untouched and
all the overriding styles defined in the `ListingImageGallery.module.css` file. This enables
updating the library in the future.

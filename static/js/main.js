document.addEventListener('DOMContentLoaded', function() {
    // Set background images for project cards
    const projectImages = document.querySelectorAll('.project-image-custom');
    projectImages.forEach(function(image) {
        const imageUrl = image.getAttribute('data-image');
        if (imageUrl) {
            // Set the background image using the data attribute
            image.style.backgroundImage = `url('/static/images/${imageUrl}')`;
        }
    });
});

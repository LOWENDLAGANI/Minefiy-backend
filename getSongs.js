const cloudinary = require('cloudinary').v2;

exports.handler = async (event, context) => {
  // Securely configure Cloudinary using environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  try {
    // Search for all resources of type 'video' (which includes mp3)
    const { resources } = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'video', // 'video' type is used for audio files in Cloudinary
      max_results: 500, // Get up to 500 songs
    });

    // Transform the data into the structure our app expects
    const songs = resources
      .filter(file => file.format === 'mp3') // Make sure we only process mp3 files
      .map(file => {
        // For album art, automatically find an image with the same public_id
        const albumArtURL = cloudinary.url(file.public_id, {
          resource_type: 'image',
          // If it can't find a jpg, try a png, otherwise it's an empty string
          // This assumes your images are jpg or png.
          fetch_format: 'auto',
          quality: 'auto'
        });

        return {
          id: file.public_id,
          songName: file.public_id.replace(/_/g, ' '), // Replace underscores with spaces for a cleaner name
          artist: "Unknown Artist", // Artist metadata is not easily available this way
          albumArtURL: albumArtURL,
          fileURL: file.secure_url,
        };
      });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(songs),
    };

  } catch (error) {
    console.error('Cloudinary API Error:', error);
    return {
      statusCode: 502, // Bad Gateway
      body: JSON.stringify({
        error: 'Failed to fetch songs from the provider.',
        details: error.message,
      }),
    };
  }
};
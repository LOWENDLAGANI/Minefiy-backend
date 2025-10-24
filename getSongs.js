// Import the Cloudinary library
const cloudinary = require('cloudinary').v2;

exports.handler = async function(event, context) {
    // Configure Cloudinary with your secret credentials
    // (We will set these in the Netlify dashboard, not in the code)
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
        // Search Cloudinary for all MP3 files
        const { resources } = await cloudinary.search
            .expression('resource_type:video AND format:mp3')
            .sort_by('public_id', 'desc')
            .max_results(200) // Get up to 200 songs
            .execute();

        // Format the results into the JSON structure our app needs
        const songs = resources.map(file => ({
            id: file.public_id,
            songName: file.filename.replace(/\.[^/.]+$/, ""), // Removes the file extension
            artist: file.artist || "Unknown Artist", // Uses metadata if available
            albumArtURL: '', // We can improve this later
            fileURL: file.secure_url,
        }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(songs),
        };
    } catch (error) {
        console.error("Error fetching from Cloudinary:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to fetch songs." }),
        };
    }
};
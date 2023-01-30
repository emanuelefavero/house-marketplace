# House Marketplace

Find and list houses for sale or for rent. This is a React / Firebase v9 project from the React Front To Back 2022 course.

Test App on Vercel: [https://house-marketplace-sigma-three.vercel.app/](https://house-marketplace-sigma-three.vercel.app/)

#### Screenshot

![screenshot](./screenshot.png 'screenshot')

## Usage

> Note: The listings use Google geocoding to get the coords from the address field. You need to either create an `.env` file and add your Google Geocode API key OR in the **CreateListing.jsx** file you can set **geolocationEnabled** to "false" and it will add a lat/lng field to the form.

### Run app locally

- clone the repo and create a `.env` file with this key:

```env
REACT_APP_GEOCODE_API_KEY="YOUR GEOCODE API KEY"
```

> Note: You can find your Google Geocode API key in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) in the credentials section (be sure to be in the correct project)

- install dependencies and run the app:

```bash
npm i
npm start
```

## License

- [MIT](LICENSE.md)

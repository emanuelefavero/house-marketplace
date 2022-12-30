import { useState, useEffect, useRef } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
} from 'firebase/storage'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.config'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { v4 as uuidv4 } from 'uuid'
import Spinner from '../components/Spinner'

function CreateListing() {
    // eslint-disable-next-line
    const [geolocationEnabled, setGeolocationEnabled] = useState(true)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        type: 'rent',
        name: '',
        bedrooms: 1,
        bathrooms: 1,
        parking: false,
        furnished: false,
        address: '',
        offer: false,
        regularPrice: 0,
        discountedPrice: 0,
        images: {},
        latitude: 0,
        longitude: 0,
    })

    const {
        type,
        name,
        bedrooms,
        bathrooms,
        parking,
        furnished,
        address,
        offer,
        regularPrice,
        discountedPrice,
        images,
        latitude,
        longitude,
    } = formData

    const auth = getAuth()
    const navigate = useNavigate()
    const isMounted = useRef(true)

    useEffect(() => {
        if (isMounted) {
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    setFormData({ ...formData, userRef: user.uid })
                } else {
                    navigate('/sign-in')
                }
            })
        }

        return () => {
            isMounted.current = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted])

    const onSubmit = async (e) => {
        e.preventDefault()

        setLoading(true)

        if (discountedPrice >= regularPrice) {
            setLoading(false)
            toast.error('Discounted price needs to be less than regular price')
            return
        }

        if (images.length > 6) {
            setLoading(false)
            toast.error('Max 6 images')
            return
        }

        // NOTE: GEOLOCATION
        let geolocation = {}
        let location

        // If geolocation is enabled by the user, make api call to google geocoding api
        //         // BEWARE: .env variables must start with REACT_APP_ in react. you don't need to require dotenv. However don't use .env in production with react, store the api key in the backend with node or in a database with hashing
        if (geolocationEnabled) {
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`
            )

            const data = await response.json()

            // ?. ?? check for null, if null: assign 0 to .lat and .lng objects
            geolocation.lat = data.results[0]?.geometry.location.lat ?? 0
            geolocation.lng = data.results[0]?.geometry.location.lng ?? 0

            // assign formatted address to location unless the api gives 'ZERO_RESULTS', if so, assign undefined to location
            location =
                data.status === 'ZERO_RESULTS'
                    ? undefined
                    : data.results[0]?.formatted_address

            // if location is undefined, show error to user with toastify
            if (location === undefined || location.includes('undefined')) {
                setLoading(false)
                toast.error('Please enter a correct address')
                return
            }
        } else {
            geolocation.lat = latitude
            geolocation.lng = longitude
        }

        // Store image in firebase
        const storeImage = async (image) => {
            return new Promise((resolve, reject) => {
                const storage = getStorage()
                const fileName = `${auth.currentUser.uid}-${
                    image.name
                }-${uuidv4()}`

                const storageRef = ref(storage, 'images/' + fileName)

                const uploadTask = uploadBytesResumable(storageRef, image)

                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress =
                            (snapshot.bytesTransferred / snapshot.totalBytes) *
                            100
                        console.log('Upload is ' + progress + '% done')
                        switch (snapshot.state) {
                            case 'paused':
                                console.log('Upload is paused')
                                break
                            case 'running':
                                console.log('Upload is running')
                                break
                            default:
                                break
                        }
                    },
                    (error) => {
                        reject(error)
                    },
                    () => {
                        // Handle successful uploads on complete
                        // For instance, get the download URL: https://firebasestorage.googleapis.com/...
                        getDownloadURL(uploadTask.snapshot.ref).then(
                            (downloadURL) => {
                                resolve(downloadURL)
                            }
                        )
                    }
                )
            })
        }

        const imageUrls = await Promise.all(
            [...images].map((image) => storeImage(image))
        ).catch(() => {
            setLoading(false)
            toast.error('Images not uploaded')
            return
        })

        const formDataCopy = {
            ...formData,
            imageUrls,
            geolocation,
            timestamp: serverTimestamp(),
        }

        formDataCopy.location = address
        delete formDataCopy.images
        delete formDataCopy.address
        !formDataCopy.offer && delete formDataCopy.discountedPrice

        const docRef = await addDoc(collection(db, 'listings'), formDataCopy)
        setLoading(false)
        toast.success('Listing saved')
        navigate(`/category/${formDataCopy.type}/${docRef.id}`)
    }

    const onMutate = (e) => {
        let boolean = null

        if (e.target.value === 'true') {
            boolean = true
        }
        if (e.target.value === 'false') {
            boolean = false
        }

        // Files
        if (e.target.files) {
            setFormData((prevState) => ({
                ...prevState,
                images: e.target.files,
            }))
        }

        // Text/Booleans/Numbers
        if (!e.target.files) {
            setFormData((prevState) => ({
                ...prevState,
                [e.target.id]: boolean ?? e.target.value,
            }))
        }
    }

    if (loading) {
        return <Spinner />
    }

    return (
        <div className='profile'>
            <header>
                <p className='pageHeader'>Create a Listing</p>
            </header>

            <main>
                <form onSubmit={onSubmit}>
                    <label className='formLabel'>Sell / Rent</label>
                    <div className='formButtons'>
                        <button
                            type='button'
                            className={
                                type === 'sale'
                                    ? 'formButtonActive'
                                    : 'formButton'
                            }
                            id='type'
                            value='sale'
                            onClick={onMutate}
                        >
                            Sell
                        </button>
                        <button
                            type='button'
                            className={
                                type === 'rent'
                                    ? 'formButtonActive'
                                    : 'formButton'
                            }
                            id='type'
                            value='rent'
                            onClick={onMutate}
                        >
                            Rent
                        </button>
                    </div>

                    <label className='formLabel'>Name</label>
                    <input
                        className='formInputName'
                        type='text'
                        id='name'
                        value={name}
                        onChange={onMutate}
                        maxLength='32'
                        minLength='10'
                        required
                    />

                    <div className='formRooms flex'>
                        <div>
                            <label className='formLabel'>Bedrooms</label>
                            <input
                                className='formInputSmall'
                                type='number'
                                id='bedrooms'
                                value={bedrooms}
                                onChange={onMutate}
                                min='1'
                                max='50'
                                required
                            />
                        </div>
                        <div>
                            <label className='formLabel'>Bathrooms</label>
                            <input
                                className='formInputSmall'
                                type='number'
                                id='bathrooms'
                                value={bathrooms}
                                onChange={onMutate}
                                min='1'
                                max='50'
                                required
                            />
                        </div>
                    </div>

                    <label className='formLabel'>Parking spot</label>
                    <div className='formButtons'>
                        <button
                            className={
                                parking ? 'formButtonActive' : 'formButton'
                            }
                            type='button'
                            id='parking'
                            value={true}
                            onClick={onMutate}
                            min='1'
                            max='50'
                        >
                            Yes
                        </button>
                        <button
                            className={
                                !parking && parking !== null
                                    ? 'formButtonActive'
                                    : 'formButton'
                            }
                            type='button'
                            id='parking'
                            value={false}
                            onClick={onMutate}
                        >
                            No
                        </button>
                    </div>

                    <label className='formLabel'>Furnished</label>
                    <div className='formButtons'>
                        <button
                            className={
                                furnished ? 'formButtonActive' : 'formButton'
                            }
                            type='button'
                            id='furnished'
                            value={true}
                            onClick={onMutate}
                        >
                            Yes
                        </button>
                        <button
                            className={
                                !furnished && furnished !== null
                                    ? 'formButtonActive'
                                    : 'formButton'
                            }
                            type='button'
                            id='furnished'
                            value={false}
                            onClick={onMutate}
                        >
                            No
                        </button>
                    </div>

                    <label className='formLabel'>Address</label>
                    <textarea
                        className='formInputAddress'
                        type='text'
                        id='address'
                        value={address}
                        onChange={onMutate}
                        required
                    />

                    {!geolocationEnabled && (
                        <div className='formLatLng flex'>
                            <div>
                                <label className='formLabel'>Latitude</label>
                                <input
                                    className='formInputSmall'
                                    type='number'
                                    id='latitude'
                                    value={latitude}
                                    onChange={onMutate}
                                    required
                                />
                            </div>
                            <div>
                                <label className='formLabel'>Longitude</label>
                                <input
                                    className='formInputSmall'
                                    type='number'
                                    id='longitude'
                                    value={longitude}
                                    onChange={onMutate}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <label className='formLabel'>Offer</label>
                    <div className='formButtons'>
                        <button
                            className={
                                offer ? 'formButtonActive' : 'formButton'
                            }
                            type='button'
                            id='offer'
                            value={true}
                            onClick={onMutate}
                        >
                            Yes
                        </button>
                        <button
                            className={
                                !offer && offer !== null
                                    ? 'formButtonActive'
                                    : 'formButton'
                            }
                            type='button'
                            id='offer'
                            value={false}
                            onClick={onMutate}
                        >
                            No
                        </button>
                    </div>

                    <label className='formLabel'>Regular Price</label>
                    <div className='formPriceDiv'>
                        <input
                            className='formInputSmall'
                            type='number'
                            id='regularPrice'
                            value={regularPrice}
                            onChange={onMutate}
                            min='50'
                            max='750000000'
                            required
                        />
                        {type === 'rent' && (
                            <p className='formPriceText'>$ / Month</p>
                        )}
                    </div>

                    {offer && (
                        <>
                            <label className='formLabel'>
                                Discounted Price
                            </label>
                            <input
                                className='formInputSmall'
                                type='number'
                                id='discountedPrice'
                                value={discountedPrice}
                                onChange={onMutate}
                                min='50'
                                max='750000000'
                                required={offer}
                            />
                        </>
                    )}

                    <label className='formLabel'>Images</label>
                    <p className='imagesInfo'>
                        The first image will be the cover (max 6).
                    </p>
                    <input
                        className='formInputFile'
                        type='file'
                        id='images'
                        onChange={onMutate}
                        max='6'
                        accept='.jpg,.png,.jpeg'
                        multiple
                        required
                    />
                    <button
                        type='submit'
                        className='primaryButton createListingButton'
                    >
                        Create Listing
                    </button>
                </form>
            </main>
        </div>
    )
}

export default CreateListing

// import { useState, useEffect, useRef } from 'react'
// import { getAuth, onAuthStateChanged } from 'firebase/auth'
// import { useNavigate } from 'react-router-dom'
// import Spinner from '../components/Spinner'
// import { toast } from 'react-toastify'

// function CreateListing() {
//     const [geolocationEnabled, setGeolocationEnabled] = useState(false)
//     const [loading, setLoading] = useState(false)
//     const [formData, setFormData] = useState({
//         type: 'rent',
//         name: '',
//         bedrooms: 1,
//         bathrooms: 1,
//         parking: false,
//         furnished: false,
//         address: '',
//         offer: false,
//         regularPrice: 0,
//         discountedPrice: 0,
//         images: {},
//         latitude: 0,
//         longitude: 0,
//     })

//     // Destructure formData so we can call single variables
//     const {
//         type,
//         name,
//         bedrooms,
//         bathrooms,
//         parking,
//         furnished,
//         address,
//         offer,
//         regularPrice,
//         discountedPrice,
//         images,
//         latitude,
//         longitude,
//     } = formData

//     const auth = getAuth()
//     const navigate = useNavigate()
//     // We use useRef isMounted to avoid react callback state loop error
//     const isMounted = useRef(true)

//     // On Page Load:
//     useEffect(() => {
//         // If Component reference is mounted
//         if (isMounted) {
//             // when authorization state changes
//             onAuthStateChanged(auth, (user) => {
//                 // if we are logged in
//                 if (user) {
//                     // update form data for the user that we are logged in
//                     // this will also the userRef object key referencing the user if
//                     setFormData({ ...formData, userRef: user.uid })
//                 } else {
//                     // if we aren't logged in, go to /sign-in page
//                     navigate('/sign-in')
//                 }
//             })
//         }
//         return (isMounted.current = false)
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, [isMounted])

//     if (loading) {
//         return <Spinner />
//     }

//     const onSubmit = async (e) => {
//         e.preventDefault()

//         setLoading(true)

//         if (discountedPrice >= regularPrice) {
//             setLoading(false)
//             toast.error('Discounted price needs to be less than regular price')
//             return
//         }

//         if (images.length > 6) {
//             setLoading(false)
//             toast.error('Max 6 images')
//             return
//         }

//         // NOTE: GEOLOCATION
//         let geolocation = {}
//         let location

//         // If geolocation is enabled by the user, make api call to google geocoding api
//         // BEWARE: .env variables must start with REACT_APP_ in react. you don't need to require dotenv. However don't use .env in production with react, store the api key in the backend with node or in a database with hashing
//         if (geolocationEnabled) {
//             const response = await fetch(
//                 `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`
//             )

//             const data = await response.json()

//             console.log(data)

//             // if object keys .geometry .location .lat exist return that value, if undefined or null return 0. assign value to our .lat and .lng object keys
//             geolocation.lat = data.results[0]?.geometry.location.lat ?? 0
//             geolocation.lng = data.results[0]?.geometry.location.lng ?? 0

//             // handle no results from geocoding api.
//             location =
//                 data.status === 'ZERO_RESULTS'
//                     ? undefined
//                     : data.results[0]?.formatted_address

//             if (location === undefined || location.includes('undefined')) {
//                 setLoading(false)
//                 toast.error('Please enter a correct address')
//                 return
//             }
//             // else: assign user defined latitude and longitude values to .lat .lng object keys
//         } else {
//             geolocation.lat = latitude
//             geolocation.lng = longitude
//         }
//     }

//     const onMutate = (e) => {
//         // ---- Handle Each form Data Case ----
//         // check for boolean from input value and create boolean variable with actual boolean values instead of text
//         let boolean = null
//         if (e.target.value === 'true') {
//             boolean = true
//         }
//         if (e.target.value === 'false') {
//             boolean = false
//         }

//         // check if value is Files array (input:file)
//         if (e.target.files) {
//             setFormData((prevState) => ({
//                 ...prevState,
//                 // set  formData images object key to files array
//                 images: e.target.files,
//             }))
//         }

//         // check if value is NOT files
//         // So if value is either Text/Booleans/Numbers:
//         if (!e.target.files) {
//             setFormData((prevState) => ({
//                 ...prevState,
//                 // 1. set the target id the form data object key to update
//                 // 2. use the nullish coalescing operator (??), so:
//                 // 3. if boolean is null pass the target value
//                 // 4. if boolean is true or false pass boolean
//                 [e.target.id]: boolean ?? e.target.value,

//                 // ??
//                 // The nullish coalescing operator is a logical operator that returns its right-hand side operand when its left-hand side operand is null or undefined, and otherwise returns its left-hand side operand.
//             }))
//         }
//     }

//     return (
//         <div className='profile'>
//             <header>
//                 <p className='pageHeader'>Create a Listing</p>
//             </header>

//             <main>
//                 <form onSubmit={onSubmit}>
//                     <label className='formLabel'>Sell / Rent</label>
//                     <div className='formButtons'>
//                         <button
//                             type='button'
//                             className={
//                                 type === 'sale'
//                                     ? 'formButtonActive'
//                                     : 'formButton'
//                             }
//                             id='type'
//                             value='sale'
//                             onClick={onMutate}
//                         >
//                             Sell
//                         </button>
//                         <button
//                             type='button'
//                             className={
//                                 type === 'rent'
//                                     ? 'formButtonActive'
//                                     : 'formButton'
//                             }
//                             id='type'
//                             value='rent'
//                             onClick={onMutate}
//                         >
//                             Rent
//                         </button>
//                     </div>

//                     <label className='formLabel'>Name</label>
//                     <input
//                         className='formInputName'
//                         type='text'
//                         id='name'
//                         value={name}
//                         onChange={onMutate}
//                         maxLength='32'
//                         minLength='10'
//                         required
//                     />

//                     <div className='formRooms flex'>
//                         <div>
//                             <label className='formLabel'>Bedrooms</label>
//                             <input
//                                 className='formInputSmall'
//                                 type='number'
//                                 id='bedrooms'
//                                 value={bedrooms}
//                                 onChange={onMutate}
//                                 min='1'
//                                 max='50'
//                                 required
//                             />
//                         </div>
//                         <div>
//                             <label className='formLabel'>Bathrooms</label>
//                             <input
//                                 className='formInputSmall'
//                                 type='number'
//                                 id='bathrooms'
//                                 value={bathrooms}
//                                 onChange={onMutate}
//                                 min='1'
//                                 max='50'
//                                 required
//                             />
//                         </div>
//                     </div>

//                     <label className='formLabel'>Parking spot</label>
//                     <div className='formButtons'>
//                         <button
//                             className={
//                                 parking ? 'formButtonActive' : 'formButton'
//                             }
//                             type='button'
//                             id='parking'
//                             value={true}
//                             onClick={onMutate}
//                             min='1'
//                             max='50'
//                         >
//                             Yes
//                         </button>
//                         <button
//                             className={
//                                 !parking && parking !== null
//                                     ? 'formButtonActive'
//                                     : 'formButton'
//                             }
//                             type='button'
//                             id='parking'
//                             value={false}
//                             onClick={onMutate}
//                         >
//                             No
//                         </button>
//                     </div>

//                     <label className='formLabel'>Furnished</label>
//                     <div className='formButtons'>
//                         <button
//                             className={
//                                 furnished ? 'formButtonActive' : 'formButton'
//                             }
//                             type='button'
//                             id='furnished'
//                             value={true}
//                             onClick={onMutate}
//                         >
//                             Yes
//                         </button>
//                         <button
//                             className={
//                                 !furnished && furnished !== null
//                                     ? 'formButtonActive'
//                                     : 'formButton'
//                             }
//                             type='button'
//                             id='furnished'
//                             value={false}
//                             onClick={onMutate}
//                         >
//                             No
//                         </button>
//                     </div>

//                     <label className='formLabel'>Address</label>
//                     <textarea
//                         className='formInputAddress'
//                         type='text'
//                         id='address'
//                         value={address}
//                         onChange={onMutate}
//                         required
//                     />

//                     {!geolocationEnabled && (
//                         <div className='formLatLng flex'>
//                             <div>
//                                 <label className='formLabel'>Latitude</label>
//                                 <input
//                                     className='formInputSmall'
//                                     type='number'
//                                     id='latitude'
//                                     value={latitude}
//                                     onChange={onMutate}
//                                     required
//                                 />
//                             </div>
//                             <div>
//                                 <label className='formLabel'>Longitude</label>
//                                 <input
//                                     className='formInputSmall'
//                                     type='number'
//                                     id='longitude'
//                                     value={longitude}
//                                     onChange={onMutate}
//                                     required
//                                 />
//                             </div>
//                         </div>
//                     )}

//                     <label className='formLabel'>Offer</label>
//                     <div className='formButtons'>
//                         <button
//                             className={
//                                 offer ? 'formButtonActive' : 'formButton'
//                             }
//                             type='button'
//                             id='offer'
//                             value={true}
//                             onClick={onMutate}
//                         >
//                             Yes
//                         </button>
//                         <button
//                             className={
//                                 !offer && offer !== null
//                                     ? 'formButtonActive'
//                                     : 'formButton'
//                             }
//                             type='button'
//                             id='offer'
//                             value={false}
//                             onClick={onMutate}
//                         >
//                             No
//                         </button>
//                     </div>

//                     <label className='formLabel'>Regular Price</label>
//                     <div className='formPriceDiv'>
//                         <input
//                             className='formInputSmall'
//                             type='number'
//                             id='regularPrice'
//                             value={regularPrice}
//                             onChange={onMutate}
//                             min='50'
//                             max='750000000'
//                             required
//                         />
//                         {type === 'rent' && (
//                             <p className='formPriceText'>$ / Month</p>
//                         )}
//                     </div>

//                     {offer && (
//                         <>
//                             <label className='formLabel'>
//                                 Discounted Price
//                             </label>
//                             <input
//                                 className='formInputSmall'
//                                 type='number'
//                                 id='discountedPrice'
//                                 value={discountedPrice}
//                                 onChange={onMutate}
//                                 min='50'
//                                 max='750000000'
//                                 required={offer}
//                             />
//                         </>
//                     )}

//                     <label className='formLabel'>Images</label>
//                     <p className='imagesInfo'>
//                         The first image will be the cover (max 6).
//                     </p>
//                     <input
//                         className='formInputFile'
//                         type='file'
//                         id='images'
//                         onChange={onMutate}
//                         max='6'
//                         accept='.jpg,.png,.jpeg'
//                         multiple
//                         required
//                     />
//                     <button
//                         type='submit'
//                         className='primaryButton createListingButton'
//                     >
//                         Create Listing
//                     </button>
//                 </form>
//             </main>
//         </div>
//     )
// }

// export default CreateListing

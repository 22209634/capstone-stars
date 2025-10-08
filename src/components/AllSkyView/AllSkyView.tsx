import './AllSkyView.css';

export default function AllSkyView() {
    // Using CDS HiPS2FITS service to generate a wide-field sky image
    // Using 2MASS survey which is smoother and doesn't have visible tile boundaries
    const allSkyImageUrl = 'https://alasky.cds.unistra.fr/hips-image-services/hips2fits?' +
        'hips=CDS/P/2MASS/color&' +
        'width=600&' +
        'height=400&' +
        'projection=TAN&' +
        'coordsys=icrs&' +
        'ra=0&' +
        'dec=0&' +
        'fov=60&' +
        'format=png';

    return (
        <div className="allsky-view__wrapper">
            <img
                alt="Wide-Field Sky View from 2MASS Survey"
                src={allSkyImageUrl}
            />
        </div>
    )
}
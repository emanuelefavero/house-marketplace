import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ReactComponent as OfferIcon } from '../assets/svg/localOfferIcon.svg'
import { ReactComponent as ExploreIcon } from '../assets/svg/exploreIcon.svg'
import { ReactComponent as PersonOutlineIcon } from '../assets/svg/personOutlineIcon.svg'

function Navbar() {
    const navigate = useNavigate()
    const location = useLocation()

    const pathMatchRoute = (route) => {
        if (route === location.pathname) {
            return true
        }
    }

    // *Check if browser is NOT mobile, then
    // Show/Hide Navbar On Scroll:
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const [height, setHeight] = useState(isMobile ? 90 : 65)

    if (!isMobile) {
        let previousScrollPosition = window.pageYOffset
        window.onscroll = () => {
            const currentScrollPosition = window.pageYOffset

            if (
                // scrolling up, show navbar
                previousScrollPosition > currentScrollPosition
            ) {
                setHeight(65)
            } else if (
                // scrolled at the bottom, show navbar
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight
            ) {
                setHeight(65)
            } else {
                // if scrolling down, hide nav
                setHeight(0)
            }
            previousScrollPosition = currentScrollPosition
        }
    }

    return (
        <footer style={{ height: height + 'px' }} className='navbar'>
            <nav className='navbarNav'>
                <ul className='navbarListItems'>
                    <li
                        className='navbarListItem'
                        onClick={() => navigate('/')}
                    >
                        <ExploreIcon
                            fill={pathMatchRoute('/') ? '#2c2c2c' : '#8f8f8f'}
                            width='28px'
                            height='28px'
                        />
                        <p
                            className={
                                pathMatchRoute('/')
                                    ? 'navbarListItemNameActive'
                                    : 'navbarListItemName'
                            }
                        >
                            Explore
                        </p>
                    </li>
                    <li
                        className='navbarListItem'
                        onClick={() => navigate('/offers')}
                    >
                        <OfferIcon
                            fill={
                                pathMatchRoute('/offers')
                                    ? '#2c2c2c'
                                    : '#8f8f8f'
                            }
                            width='28px'
                            height='28px'
                        />
                        <p
                            className={
                                pathMatchRoute('/offer')
                                    ? 'navbarListItemNameActive'
                                    : 'navbarListItemName'
                            }
                        >
                            Offers
                        </p>
                    </li>
                    <li
                        className='navbarListItem'
                        onClick={() => navigate('/profile')}
                    >
                        <PersonOutlineIcon
                            fill={
                                pathMatchRoute('/profile')
                                    ? '#2c2c2c'
                                    : '#8f8f8f'
                            }
                            width='28px'
                            height='28px'
                        />
                        <p
                            className={
                                pathMatchRoute('/profile')
                                    ? 'navbarListItemNameActive'
                                    : 'navbarListItemName'
                            }
                        >
                            Profile
                        </p>
                    </li>
                </ul>
            </nav>
        </footer>
    )
}

export default Navbar

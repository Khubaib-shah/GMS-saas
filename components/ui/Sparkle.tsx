import React from 'react'

const Sparkle = () => {
    return (
        <>
            <div className="relative w-2 h-2 flex items-center justify-center overflow-visible">
                <div className="hidden group-hover:block pegtop-loader scale-[1] absolute">
                    <svg id="pegtopone" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="absolute transition-opacity duration-300">
                        <defs>
                            <filter id="shine"><feGaussianBlur stdDeviation="3" /></filter>
                            <mask id="mask"><path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="white" /></mask>
                            <radialGradient id="gradient-1" cx="50" cy="66" r="30" gradientTransform="translate(0 35) scale(1 0.5)" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="black" stopOpacity="0.3" /><stop offset="50%" stopColor="black" stopOpacity="0.1" /><stop offset="100%" stopColor="black" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id="gradient-2" cx="55" cy="20" r="30" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="white" stopOpacity="0.3" /><stop offset="50%" stopColor="white" stopOpacity="0.1" /><stop offset="100%" stopColor="white" stopOpacity="0" />
                            </radialGradient>
                            <radialGradient id="gradient-3" cx="85" cy="50" r="30" xlinkHref="#gradient-2" />
                            <radialGradient id="gradient-4" cx="50" cy="58" r="60" gradientTransform="translate(0 47) scale(1 0.2)" xlinkHref="#gradient-3" />
                            <linearGradient id="gradient-5" x1="50" y1="90" x2="50" y2="10" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="black" stopOpacity="0.2" /><stop offset="40%" stopColor="black" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <g className="fill-white group-hover:fill-white">
                            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="currentColor" />
                            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-1)" />
                            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="none" stroke="white" opacity="0.3" strokeWidth="3" filter="url(#shine)" mask="url(#mask)" />
                            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-2)" />
                            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-3)" />
                            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-4)" />
                            <path d="M63,37c-6.7-4-4-27-13-27s-6.3,23-13,27-27,4-27,13,20.3,9,27,13,4,27,13,27,6.3-23,13-27,27-4,27-13-20.3-9-27-13Z" fill="url(#gradient-5)" />
                        </g>
                    </svg>
                    <svg id="pegtoptwo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="absolute opacity-0 transition-opacity duration-300">
                        <use href="#pegtopone" />
                    </svg>
                    <svg id="pegtopthree" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="absolute opacity-0 transition-opacity duration-300">
                        <use href="#pegtopone" />
                    </svg>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
    .pegtop-loader {
        --fill-color: #fff;
        --shine-color: rgba(255,255,255,0.2);
        width: 100px;
        height: 100px;
        position: relative;
        pointer-events: none;
    }
    
    .upgrade-btn-group:hover #pegtopone {
        animation: flowe-one 1s linear infinite !important;
    }
    .upgrade-btn-group:hover #pegtoptwo {
        animation: flowe-two 1s linear infinite !important;
        animation-delay: 0.3s !important;
    }
    .upgrade-btn-group:hover #pegtopthree {
        animation: flowe-three 1s linear infinite !important;
        animation-delay: 0.6s !important;
    }

    @keyframes flowe-one {
        0% { transform: scale(0.5) translateY(-200px); opacity: 0; }
        25% { transform: scale(0.75) translateY(-100px); opacity: 1; }
        50% { transform: scale(1) translateY(0px); opacity: 1; }
        75% { transform: scale(0.5) translateY(50px); opacity: 1; }
        100% { transform: scale(0) translateY(100px); opacity: 0; }
    }

    @keyframes flowe-two {
        0% { transform: scale(0.5) rotateZ(-10deg) translateY(-200px) translateX(-100px); opacity: 0; }
        25% { transform: scale(1) rotateZ(-5deg) translateY(-100px) translateX(-50px); opacity: 1; }
        50% { transform: scale(1) rotateZ(0deg) translateY(0px) translateX(-25px); opacity: 1; }
        75% { transform: scale(0.5) rotateZ(5deg) translateY(50px) translateX(0px); opacity: 1; }
        100% { transform: scale(0) rotateZ(10deg) translateY(100px) translateX(25px); opacity: 0; }
    }

    @keyframes flowe-three {
        0% { transform: scale(0.5) rotateZ(10deg) translateY(-200px) translateX(100px); opacity: 0; }
        25% { transform: scale(1) rotateZ(5deg) translateY(-100px) translateX(50px); opacity: 1; }
        50% { transform: scale(1) rotateZ(0deg) translateY(0px) translateX(25px); opacity: 1; }
        75% { transform: scale(0.5) rotateZ(-5deg) translateY(50px) translateX(0px); opacity: 1; }
        100% { transform: scale(0) rotateZ(-10deg) translateY(100px) translateX(-25px); opacity: 0; }
    }
`}} />
        </>
    )
}

export default Sparkle
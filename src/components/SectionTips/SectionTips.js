import React, { useState } from 'react';
import css from './SectionTips.module.css';

const SectionTips = () => { 
    return (
        <div className={css.sectionbody}>
            <div className={css.sectiontitle}>
                Tips For A Successful Gathering
            </div>
            <div className={css.sectioncontent}>
                <div className={css.tipsitem}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                        <g clip-path="url(#clip0_81_2797)">
                            <path d="M8.22759 3.5166L12.5 8.05762L16.7725 3.5166H8.22759ZM18.7452 4.83984L15.21 8.59473H21.5088L18.7452 4.83984ZM21.1866 10.9385H12.5H3.81353L12.5 20.5234L21.1866 10.9385ZM3.49126 8.59473H9.79009L6.25493 4.83984L3.49126 8.59473ZM24.6973 10.5527L13.3692 23.0527C13.1495 23.2969 12.8321 23.4385 12.5 23.4385C12.168 23.4385 11.8555 23.2969 11.6309 23.0527L0.302783 10.5527C-0.0731934 10.1377 -0.10249 9.51758 0.229541 9.06836L5.69829 1.64648C5.91802 1.34863 6.26958 1.16797 6.64067 1.16797H18.3594C18.7305 1.16797 19.0821 1.34375 19.3018 1.64648L24.7706 9.06836C25.1026 9.51758 25.0684 10.1377 24.6973 10.5527Z" fill="#06C167"/>
                        </g>
                        <defs>
                            <clipPath id="clip0_81_2797">
                            <rect width="25" height="25" fill="white"/>
                            </clipPath>
                        </defs>
                    </svg>
                    <div className={css.tipstitle}>Outline your goals </div>
                    <div className={css.tipsdescription}>
                        Search for activities that fit those goals. Equally as important, ensure that the environment is conducive to building rapport and connection so its remember long after.
                    </div>
                </div>
                <div className={css.tipsitem}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="29" height="25" viewBox="0 0 29 25" fill="none">
                        <g clip-path="url(#clip0_81_2805)">
                            <path d="M14.0576 0C14.5068 0 14.917 0.253906 15.1123 0.65918L18.4619 7.55859L25.9424 8.66211C26.3818 8.72559 26.748 9.0332 26.8847 9.45801C27.0215 9.88281 26.9091 10.3418 26.5966 10.6543L21.1718 16.0352L22.4511 23.6328C22.5244 24.0723 22.3437 24.5166 21.9824 24.7803C21.6211 25.0439 21.1377 25.0732 20.747 24.8633L14.0576 21.2891L7.37301 24.8584C6.97751 25.0684 6.49899 25.0391 6.13766 24.7754C5.77633 24.5117 5.59079 24.0674 5.66403 23.6279L6.94333 16.0303L1.51852 10.6543C1.20114 10.3418 1.09372 9.87793 1.23044 9.45801C1.36716 9.03809 1.73337 8.73047 2.17282 8.66211L9.65329 7.55859L13.0029 0.65918C13.2031 0.253906 13.6084 0 14.0576 0ZM14.0576 3.85742L11.4941 9.14062C11.3232 9.4873 10.9961 9.73145 10.6103 9.79004L4.83395 10.6396L9.02829 14.7949C9.29684 15.0635 9.4238 15.4443 9.36032 15.8203L8.36911 21.665L13.5058 18.9209C13.8525 18.7354 14.2675 18.7354 14.6093 18.9209L19.7461 21.665L18.7597 15.8252C18.6963 15.4492 18.8183 15.0684 19.0918 14.7998L23.2861 10.6445L17.5097 9.79004C17.1289 9.73145 16.7968 9.49219 16.6259 9.14062L14.0576 3.85742Z" fill="#06C167"/>
                        </g>
                        <defs>
                            <clipPath id="clip0_81_2805">
                            <rect width="28.125" height="25" fill="white"/>
                            </clipPath>
                        </defs>
                    </svg>
                    <div className={css.tipstitle}>Select 2-3 Experiences </div>
                    <div className={css.tipsdescription}>
                        Allowing your group to buy-in and feel a part of the process can be a game-changer. Allow your team to select their favorite from a small selection of experiences to increase participation and excitement.
                    </div>
                </div>
                <div className={css.tipsitem}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                        <g clip-path="url(#clip0_81_2801)">
                            <path d="M8.59375 1.17188C8.59375 0.522461 8.07129 0 7.42188 0C6.77246 0 6.25 0.522461 6.25 1.17188V3.125C4.52637 3.125 3.125 4.52637 3.125 6.25H1.17188C0.522461 6.25 0 6.77246 0 7.42188C0 8.07129 0.522461 8.59375 1.17188 8.59375H3.125V11.3281H1.17188C0.522461 11.3281 0 11.8506 0 12.5C0 13.1494 0.522461 13.6719 1.17188 13.6719H3.125V16.4062H1.17188C0.522461 16.4062 0 16.9287 0 17.5781C0 18.2275 0.522461 18.75 1.17188 18.75H3.125C3.125 20.4736 4.52637 21.875 6.25 21.875V23.8281C6.25 24.4775 6.77246 25 7.42188 25C8.07129 25 8.59375 24.4775 8.59375 23.8281V21.875H11.3281V23.8281C11.3281 24.4775 11.8506 25 12.5 25C13.1494 25 13.6719 24.4775 13.6719 23.8281V21.875H16.4062V23.8281C16.4062 24.4775 16.9287 25 17.5781 25C18.2275 25 18.75 24.4775 18.75 23.8281V21.875C20.4736 21.875 21.875 20.4736 21.875 18.75H23.8281C24.4775 18.75 25 18.2275 25 17.5781C25 16.9287 24.4775 16.4062 23.8281 16.4062H21.875V13.6719H23.8281C24.4775 13.6719 25 13.1494 25 12.5C25 11.8506 24.4775 11.3281 23.8281 11.3281H21.875V8.59375H23.8281C24.4775 8.59375 25 8.07129 25 7.42188C25 6.77246 24.4775 6.25 23.8281 6.25H21.875C21.875 4.52637 20.4736 3.125 18.75 3.125V1.17188C18.75 0.522461 18.2275 0 17.5781 0C16.9287 0 16.4062 0.522461 16.4062 1.17188V3.125H13.6719V1.17188C13.6719 0.522461 13.1494 0 12.5 0C11.8506 0 11.3281 0.522461 11.3281 1.17188V3.125H8.59375V1.17188ZM7.8125 6.25H17.1875C18.0518 6.25 18.75 6.94824 18.75 7.8125V17.1875C18.75 18.0518 18.0518 18.75 17.1875 18.75H7.8125C6.94824 18.75 6.25 18.0518 6.25 17.1875V7.8125C6.25 6.94824 6.94824 6.25 7.8125 6.25ZM17.1875 7.8125H7.8125V17.1875H17.1875V7.8125Z" fill="#06C167"/>
                        </g>
                        <defs>
                            <clipPath id="clip0_81_2801">
                            <rect width="25" height="25" fill="white"/>
                            </clipPath>
                        </defs>
                    </svg>
                    <div className={css.tipstitle}>Book the winning experience</div>
                    <div className={css.tipsdescription}>
                        Bevy Experiences makes it easy to book the preferred experience with all the bells and whistles. Make sure to select a preferred date and at least 2 alternative date options.
                    </div>
                </div>
                <div className={css.tipsitem}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
                        <path d="M10.5469 3.125C9.89746 3.125 9.375 3.64746 9.375 4.29688C9.375 4.94629 9.89746 5.46875 10.5469 5.46875H11.3281V7.09473C5.83984 7.67578 1.5625 12.3242 1.5625 17.9688H23.4375C23.4375 12.3242 19.1602 7.67578 13.6719 7.09473V5.46875H14.4531C15.1025 5.46875 15.625 4.94629 15.625 4.29688C15.625 3.64746 15.1025 3.125 14.4531 3.125H12.5H10.5469ZM1.17188 19.5312C0.522461 19.5312 0 20.0537 0 20.7031C0 21.3525 0.522461 21.875 1.17188 21.875H23.8281C24.4775 21.875 25 21.3525 25 20.7031C25 20.0537 24.4775 19.5312 23.8281 19.5312H1.17188Z" fill="#06C167"/>
                    </svg>
                    <div className={css.tipstitle}>Get Ready for Meaningful Connections!</div>
                    <div className={css.tipsdescription}>
                        After you've engaged the team and booked the winning activity, its time to make meaningful connections that last. At Bevy Experiences, we're committed to giving you peace of mind during this journey.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SectionTips;
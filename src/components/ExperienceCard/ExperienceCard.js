import React, { useState } from 'react';
import styled from 'styled-components';
import css from './ExperienceCard.module.css';

const ExperienceCard = props => { 
    const {
        category,
        title,
        subtitle,
        date,
        booker,
        time,
        status,
        count,
        background
    } = props;

    return (
        <div className={css.cardbody}>
            <CardImage background={background}>
                {{title}}
            </CardImage>
            <div className={css.carddate}></div>
            <div className={css.cardinfo}></div>
            <div className={css.cardaction}></div>
        </div>
    )
}

const CardImage = styled.div <{ background }>`
    width: 255px;
    height: 329px;
    flex-shrink: 0;
    background: ${({ background }) => 'url(' + background + '), lightgray 50%'};
    background-size: cover;
    background-repeat: no-repeat;
`

export default ExperienceCard;
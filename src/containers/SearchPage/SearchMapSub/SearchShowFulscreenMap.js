import React, { Component } from 'react';
import { renderToString } from 'react-dom/server'

import { IconArrowHead } from '../../../components';

/**
 * SearchMap component using Mapbox as map provider
 */

//show fullwidth map action
class SearchShowFulscreenMap {
  constructor (props) {
    // console.log(changeMapSize);
    this.fullMap = props.fullMap;
    this.div = null;
    this.map = null;
    this.changeMapSizeAction = props.changeMapSizeAction;
    this.actionChangeMapSize = this.actionChangeMapSize.bind(this);
  }
  
  actionSwithc (fullMap) {
    this.fullMap = fullMap;
    console.log(this.fullMap);
    this.div.innerHTML = '<button>'+ this.getArrow() +'</button>';
  }

  actionChangeMapSize () {
    this.fullMap = this.changeMapSizeAction();
    this.div.innerHTML = '<button>'+ this.getArrow() +'</button>';
    this.map.resize();
  }

  getArrow () {
    if(this.fullMap){
      return renderToString(<IconArrowHead direction="right" size="small" />);
    }else{
      return renderToString(<IconArrowHead direction="left" size="small" />);
    }
  }

  onAdd(map) {
    this.map = map;
    this.div = document.createElement("div");
    this.div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
    this.div.innerHTML = '<button>'+ this.getArrow() +'</button>';
    this.div.addEventListener("contextmenu", (e) => e.preventDefault());
    this.div.addEventListener("click", () => {this.actionChangeMapSize()});

    return this.div;
  }
}


export default SearchShowFulscreenMap;

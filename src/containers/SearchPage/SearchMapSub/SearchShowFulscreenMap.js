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
    this.isMapFullWidth = false;
    this.changeMapSizeAction = props.changeMapSizeAction;
    this.actionChangeMapSize = this.actionChangeMapSize.bind(this);
  }

  actionChangeMapSize (div,map) {
    this.changeMapSizeAction();
    this.isMapFullWidth = !this.isMapFullWidth;
    div.innerHTML = '<button>'+ this.getArrow() +'</button>';
    map.resize();
  }

  getArrow () {
    if(this.isMapFullWidth){
      return renderToString(<IconArrowHead direction="right" size="small" />);
    }else{
      return renderToString(<IconArrowHead direction="left" size="small" />);
    }
  }

  onAdd(map) {
    
    const div = document.createElement("div");
    div.className = "mapboxgl-ctrl mapboxgl-ctrl-group";
    div.innerHTML = '<button>'+ this.getArrow() +'</button>';
    div.addEventListener("contextmenu", (e) => e.preventDefault());
    div.addEventListener("click", () => {this.actionChangeMapSize(div,map)});

    return div;
  }
}


export default SearchShowFulscreenMap;

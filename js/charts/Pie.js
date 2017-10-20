// @flow
'use strict';

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ART,
  LayoutAnimation,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableOpacity
} from 'react-native';

const {
  Surface,
  Group,
  Rectangle,
  Shape,
} = ART;

import * as scale from 'd3-scale';
import * as shape from 'd3-shape';
import * as d3Array from 'd3-array';
import AnimShape from '../art/AnimShape';
import Theme from '../theme';

const d3 = {
  scale,
  shape,
};

import {
    scaleBand,
    scaleLinear
} from 'd3-scale';

type Props = {
  height: number,
  width: number,
  pieWidth: number,
  pieHeight: number,
  colors: any,
  onItemSelected: any
};


type State = {
  highlightedIndex: number,
};

const ARC_WIDTH = 40;

class Pie extends React.Component {

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = { highlightedIndex: 0 };
    this._createPieChart = this._createPieChart.bind(this);
    this.handleTextOnPress = this.handleTextOnPress.bind(this);
    this._value = this._value.bind(this);
    this._label = this._label.bind(this);
    this._color = this._color.bind(this);
  }

  // methods used to tranform data into piechart:
  // TODO: Expose them as part of the interface
  _value(item) { return item.number; }

  _label(item) { return item.name; }

  _color(index) { return Theme.colors[index]; }

  _createPieChart(index){
    const radius = this.getPieRadius();
    const innerRadius = this.getInnerRadius();

    var arcs = d3.shape.pie()
        .value(this._value)
        (this.props.data);

    var hightlightedArc = d3.shape.arc()
      .outerRadius(radius + 20)
      .padAngle(.05)
      .innerRadius(innerRadius);

    var arc = d3.shape.arc()
      .outerRadius(radius)
      .padAngle(.035)
      .innerRadius(innerRadius);

    this._arcData = arcs;
    var arcData = arcs[index];
    var path = (this.state.highlightedIndex == index) ? hightlightedArc(arcData) : arc(arcData);

     return {
       path,
       color: this._color(index),
     };
  }

  getPieCenter() {
    const marginTop = styles.container.marginTop;
    const marginLeft = styles.container.marginLeft;
    const centerX = this.props.pieHeight / 2 + marginLeft;
    const centerY = this.props.pieHeight / 2 + marginTop;

    return [centerX, centerY];
  }

  getPieRadius() {
    return this.props.pieWidth / 2;
  }

  getInnerRadius() {
    return this.getPieRadius() - ARC_WIDTH;
  }

  getTextPosition() {
    return [
      this.getInnerRadius() + styles.container.marginLeft + ARC_WIDTH,
      this.getInnerRadius() + styles.container.marginTop + ARC_WIDTH,
    ]
  }

  isPointWithinAnArc(x, y) {
    const [cx, cy] = this.getPieCenter();
    const radius = this.getPieRadius();
    const innerRadius = this.getInnerRadius();
    const dist = ((x - cx) ** 2) + ((y - cy) ** 2);

    return dist <= radius ** 2 && dist >= innerRadius ** 2;
  }

  handleTextOnPress() {
    console.log('Text clicked')
  }

  handleSurfaceClick(event) {
    const {locationX: x, locationY: y} = event.nativeEvent
    const [cx, cy] = this.getPieCenter();
    const diffY = y - cy;
    const diffX = x - cx;
    const angle = Math.atan2(diffY, diffX);

    // Don't ask why I did this for the following case? Just trial and fail
    // it looks like the top left quarter has some subtleties in the way we calculate the angle
    const normalizedAngle = diffY < 0 && diffX < 0
      ? angle + (Math.PI * 2) + Math.PI / 2
      : angle + (Math.PI / 2)

    if(this.isPointWithinAnArc(x, y)) {
      const index = this._arcData.findIndex(a => normalizedAngle >= a.startAngle && normalizedAngle <= a.endAngle)
      this.setState({...this.state, highlightedIndex: index});
      this.props.onItemSelected(index);
    }
  }

  getTextStyles() {
    const [left, top] = this.getTextPosition()
    const s = Object.assign({}, styles.floatingTextStyle, {left, top});
    return StyleSheet.create(s);
  }

  render() {
    const [x, y] = this.getPieCenter();
    const label = this._label(this.props.data[this.state.highlightedIndex]);

    return (
      <View width={this.props.width} height={this.props.height}>
        <View style={this.getTextStyles()}
          width={this.props.pieWidth / 2}
          height={this.props.pieHeight / 2}>
            <Text style={styles.text} onPress={() => this.handleTextOnPress(label)}>{label}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => this.handleSurfaceClick(e)}>
            <Surface width={this.props.width} height={this.props.height + 10}>
              <Group x={x} y={y}>
              {
                  this.props.data.map( (item, index) =>
                    (
                      <AnimShape
                        key={'pie_shape_' + index}
                        color={this._color(index)}
                        d={ () => this._createPieChart(index)} />
                    )
                  )
                }
              </Group>
            </Surface>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = {
  container: {
    marginTop: 40,
    marginLeft: 40
  },
  label: {
    fontSize: 15,
    marginTop: 5,
    fontWeight: 'normal',
  },

  floatingTextStyle: {
    position: 'absolute',
    flex:1,
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    alignItems: 'center',
    zIndex: 100
  },

  text: {
    fontSize: 20,
    backgroundColor: 'transparent'
  }
};

export default Pie;

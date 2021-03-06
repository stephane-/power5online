import React, { Component } from 'react';
import Dots from './Dots.js';

export default class Board extends Component {

    renderDots(row, col) {
        let className = 'dot';

        if (this.props.dots[row][col].win) {
            className = 'dot win';
        } else if (row+'-'+col === this.props.last) {
            className = 'dot last';
        }
        return (
            <Dots
                value={this.props.dots[row][col].state}
                key={row+'-'+col}
                classname={className}
                last={(row+'-'+col === this.props.last)}
                onClick={() => this.props.onClick([row, col])}
            />
        );
    }

    render() {
        let row = 0;
        let dots = [];

        for (row; row < this.props.size; row++) {
            let colDots = [];
            let col = 0;
            for (col; col < this.props.size; col++) {
                colDots.push(this.renderDots(row, col));
            }
            dots.push(<div className='dotsRow' key={'row-'+row}>{colDots}</div>);
        }
        return (
            <div className={'gameContainer'}>
                {dots}
            </div>
        );
    }
}

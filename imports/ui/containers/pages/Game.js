/*global Push*/
/*eslint no-undef: "error"*/
import React, { Component } from 'react';

import { FlowRouter } from 'meteor/kadira:flow-router';
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import i18n from 'meteor/universe:i18n';

import Board from '../parts/Board.js';
import Header from '../components/Header.js';
import Panel from '../components/Panel.js';
import ToggleButton from '../components/ToggleButton.js';
import Button from '../components/Button.js';
import Footer from '../components/Footer.js';

export default class Game extends Component {

    constructor(props) {
        super(props);
        this._id = FlowRouter.getParam('_id');
    }

    handleClick(rowcol) {
        Meteor.call('boards.addDot', this.props.board._id, rowcol[0], rowcol[1], localStorage.getItem('guest_id'));
    }

    getCurrentUser() {
        let userId = null;
        let userName = null;
        let userType = null;
        let guestId = localStorage.getItem('guest_id');

        if (Meteor.user()) {
            userId = Meteor.user()._id;
            userName = Meteor.user().power5Username;
            userType = 'meteor';
        } else {
            userId = guestId;
            userName = 'guest_' + userId;
            userType = 'guest';
        }
        return {userId, userName, userType};
    }

    changeFavicon(board) {
        let src = '/favicon';
        if (!board.end) {
            src = (board.whiteIsNext ? '/favicon-w' : '/favicon-b');
        }

        document.head.removeChild(document.getElementById('favicon'));
        document.head.removeChild(document.getElementById('faviconpng'));
        let link = document.createElement('link');
        let linkpng = document.createElement('link');
        link.id = 'favicon';
        link.rel = 'icon';
        link.href = src + '.ico';
        linkpng.id = 'faviconpng';
        linkpng.rel = 'icon';
        linkpng.href = src + '.png';
        document.head.appendChild(link);
        document.head.appendChild(linkpng);
    }

    cancelButton() {
        let board = this.props.board;

        if (board.step < 2) {
            Meteor.call('boards.cancel', this.props.board._id, localStorage.getItem('guest_id'));
            FlowRouter.go('Index');
        }
    }

    abordButton() {
        let board = this.props.board;

        if (!board.end) {
            Meteor.call('boards.abord', this.props.board._id, localStorage.getItem('guest_id'));
        }
    }

    winButton() {
        let board = this.props.board;

        if (!board.end) {
            Meteor.call('boards.win', this.props.board._id, localStorage.getItem('guest_id'));
        }
    }

    replayButton() {
        let board = this.props.board;
        let currentUser = this.getCurrentUser();

        if (board.replayId) {
            FlowRouter.go('game.show', {_id: board.replayId});
            return;
        }
        if (!board.askReplay || board.askReplay !== currentUser.userId) {
            Meteor.call('boards.replay', this.props.board._id, localStorage.getItem('guest_id'));
        }
    }

    checkReplay(board) {
        let currentUser = this.getCurrentUser();

        if (board.replayId) {
            return 'GAME_BUTTON_REPLAY_NEXT_GAME';
        }
        if (!board.askReplay) {
            return 'GAME_BUTTON_REPLAY';
        }
        if (board.askReplay !== currentUser.userId) {
            return 'GAME_BUTTON_REPLAY_OPPONENT';
        }
        if (board.askReplay === currentUser.userId) {
            return 'GAME_BUTTON_REPLAY_PROPOSED';
        }
    }

    isMyTurn() {
        let userId = this.getCurrentUser().userId;
        const current = this.props.board;

        if (current.end) {
            return false;
        }
        if (current.whiteIsNext && current.creatorIsWhite && userId === current.authorId) {
            return true;
        }
        if (current.whiteIsNext && !current.creatorIsWhite && userId === current.opponentId) {
            return true;
        }
        if (!current.whiteIsNext && current.creatorIsWhite && userId === current.opponentId) {
            return true;
        }
        if (!current.whiteIsNext && !current.creatorIsWhite && userId === current.authorId) {
            return true;
        }
        return false;
    }

    switchPrivate() {
        Meteor.call(
            'boards.switchPrivacy',
            this.props.board._id,
            localStorage.getItem('guest_id'),
            !this.props.board.private
        );
    }

    sendNotification(lastAction) {
        if (this.props.board.lastActionAt === lastAction) {
            Push.create(i18n.__('APP_TITLE'), {
                body: i18n.__('GAME_MY_ROUND_NOTIF'),
                icon: '/favicon-b.png',
                timeout: 6,
                onClick() {window.focus(); this.close();}
            });
        }
    }

    getButtons(current) {
        if (current.end) {
            return <Button text={this.checkReplay(current)} onClick={(current) => this.replayButton(current)} />;
        }

        if (current.step < 2) {
            return <Button text="GAME_BUTTON_CANCEL" onClick={(current) => this.cancelButton(current)}/>;
        }
        if (!this.isMyTurn() && (current.lastActionAt.getTime() < ((new Date()).getTime() - 1000 * 3600 * 24))) {
            return <Button text="GAME_BUTTON_FINISH" classname="bluebutton" onClick={(current) => this.winButton(current)} />;
        }
        return <Button text="GAME_BUTTON_ABORT" classname="redbutton" onClick={(current) => this.abordButton(current)} />;
    }

    checkAccess() {
        const currentUser = this.getCurrentUser();

        if (this.props.loading) {
            return (<Panel type='warn' text='GAME_LOADING' />);
        }
        if (!this.props.board.authorId) {
            if (!this.props.board.private) {
                FlowRouter.go('game.spec', {_id: this.props.board._id});
            }
            return (
                <Panel type='error' text='GAME_FULL' />
            );
        }

        if (!this.props.board.opponentId && this.props.board.authorId !== currentUser.userId) {
            Meteor.call('boards.setOpponent', this.props.board._id, localStorage.getItem('guest_id'));
        }
        return null;
    }

    render() {
        const T = i18n.createComponent();
        let button;
        const access = this.checkAccess();
        const current = this.props.board;

        if (access !== null) {
            return access;
        }
        document.title = current.game;

        if (this.isMyTurn()) {
            document.title = i18n.__('GAME_MY_ROUND');
            if (Meteor.user() && Meteor.user().power5Notification) {
                Meteor.setTimeout(() => this.sendNotification(current.lastActionAt), 30000);
            }
        }
        this.changeFavicon(current);
        button = this.getButtons(current);

        return (
            <div className="container">
                <Header
                    title={current.game}
                />
                <div className="content">
                    <div id="gameScore">
                        <div className="scoreboard">
                            <div className="scoreboardPlayer">
                                <div className={(current.whiteIsNext && !current.end) ? 'scoreboardPlayerActive' : 'scoreboardPlayerNotActive'}>
                                    <div className="scoreboardPlayerWhite"></div>
                                </div>
                                <div className="scoreboardPlayerName">
                                    <span className={(current.end && !current.draw && ((current.winnerIsAuthor && current.creatorIsWhite) || (!current.winnerIsAuthor && !current.creatorIsWhite))) ? 'winnerTrophy' : ''}></span>
                                    {(current.creatorIsWhite) ? current.authorUsername : current.opponentUsername}
                                </div>
                            </div>

                            <hr className="scoreboardSeparator"></hr>
                            <span className="scoreboardSeparatorText">{' VS '}</span>
                            <hr className="scoreboardSeparator"></hr>

                            <div className="scoreboardPlayer">
                                <div className={(!current.whiteIsNext && !current.end)? 'scoreboardPlayerActive' : 'scoreboardPlayerNotActive'}>
                                    <div className="scoreboardPlayerBlack"></div>
                                </div>
                                <div className="scoreboardPlayerName">
                                    <span className={(current.end && !current.draw && ((current.winnerIsAuthor && !current.creatorIsWhite) || (!current.winnerIsAuthor && current.creatorIsWhite))) ? 'winnerTrophy' : ''}></span>
                                    {(!current.creatorIsWhite) ? current.authorUsername : current.opponentUsername}
                                    </div>
                            </div>
                            <ToggleButton
                                check={current.private}
                                checkOnText='GAME_PRIVATE'
                                checkOffText='GAME_PUBLIC'
                                onClick={() => this.switchPrivate()}
                            />
                            <span><T>GAME_VISITOR_LINK</T></span>
                            <input
                                type="text"
                                className="disableInput"
                                defaultValue={document.location.host + '/visitor/' + current._id}
                                disabled
                            />
                            { button }
                        </div>
                    </div>
                    <div id="gameBoard" className="game-board">
                        <Board
                            dots={current.dots}
                            size={current.size}
                            last={current.last}
                            onClick={(i) => this.handleClick(i)}
                        />
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
}
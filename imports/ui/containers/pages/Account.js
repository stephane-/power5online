import React, { Component } from 'react';
import i18n from 'meteor/universe:i18n';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { Users } from '../../../api/users.js';

import Header from '../components/Header.js';
import Footer from '../components/Footer.js';
import Panel from '../components/Panel.js';
import TextInput from '../components/TextInput.js';
import ToggleButton from '../components/ToggleButton.js';

export default class Account extends Component {

    switchParam(setting) {
        switch (setting) {
            case 'allowNotification':
                Meteor.call('users.updateNotification', !this.props.user.power5Notification);
                break;
        }
    }

    changeUsername(event) {
        const username = event.target.value.trim();
        Meteor.call('users.changePublicUsername', username, function(error, result) {
            if (error) {
                document.getElementById('username_error').style.display = 'block';
                document.getElementById('username_success').style.display = 'none';
            } else {
                document.getElementById('username_success').style.display = 'block';
                document.getElementById('username_error').style.display = 'none';
            }
        });
    }

    render() {
        const T = i18n.createComponent();

        if (this.props.loading || !this.props.user || !this.props.user.power5Username) {
            return (<Panel type='warn' text='ACCOUNT_LOADING' />);
        }

        return (
            <div className="container">
                <Header
                    title="ACCOUNT_TITLE"
                />
                <div className="content">
                    <div className="account_content">
                        <h2><T>ACCOUNT_SETTINGS_TITLE</T></h2>

                        <strong><T>ACCOUNT_PUBLIC_USERNAME</T></strong>

                        <TextInput
                            ref="accountUsername"
                            placeholder=""
                            username={this.props.user.power5Username}
                            onChange={this.changeUsername}
                        />
                        <div id="username_error" className="input_error"><T>ACCOUNT_USERNAME_ALREADY_EXIST</T></div>
                        <div id="username_success" className="input_success"><T>ACCOUNT_USERNAME_SAVED</T></div>
                        <ToggleButton
                            check={this.props.user.power5Notification}
                            checkOnText='ACCOUNT_NOTIFICATION_ENABLE'
                            checkOffText='ACCOUNT_NOTIFICATION_DISABLE'
                            onClick={() => this.switchParam('allowNotification')}
                        />
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
}
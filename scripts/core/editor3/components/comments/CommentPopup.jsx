import React from 'react';
import {UserAvatar, TextWithMentions} from 'apps/users/components';
import PropTypes from 'prop-types';
import moment from 'moment';

export const CommentPopup = ({comment}) => {
    const {author, avatar, date, msg} = comment.data;
    const fromNow = moment(date).calendar();
    const fullDate = moment(date).format('MMMM Do YYYY, h:mm:ss a');

    return (
        <div>
            <div className="highlights-popup__header">
                <UserAvatar displayName={author} pictureUrl={avatar} />
                <div className="user-info">
                    <div className="author-name">{author}</div>
                    <div className="date" title={fullDate}>{fromNow}</div>
                </div>
            </div>
            <TextWithMentions className="highlights-popup__body">{msg}</TextWithMentions>
        </div>
    );
};

CommentPopup.propTypes = {
    comment: PropTypes.object
};

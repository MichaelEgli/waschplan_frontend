import React from 'react'
import './UserChooser.css'
import {
    Avatar,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
} from '@material-ui/core'
import { useSelector } from 'react-redux'

import { selectMieter } from '../state/selectors'
import { MieterDto } from '../model/model'
import { selectAvatar } from '../utils/date-utils'

export type UserChooserProps = {
    open: boolean
    userChanged: (userid: string | null) => void
}

const UserChooser: React.FC<UserChooserProps> = (props: UserChooserProps) => {
    const mieter = useSelector(selectMieter)

    return (
        <Dialog open={props.open}>
            <DialogTitle className={'Style'}>
                Für welchen Mieter soll der Termin gebucht werden?
            </DialogTitle>
            <DialogContent className={'Style'}>
                <List>
                    {mieter?.mieter.map((mieter: MieterDto) => (
                        <ListItem
                            key={mieter.id}
                            button
                            onClick={() => props.userChanged(mieter.id)}
                        >
                            <ListItemAvatar>
                                <Avatar src={selectAvatar(mieter.name)} />
                            </ListItemAvatar>
                            <ListItemText primary={mieter.name} />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions className={'Style'}>
                <Button onClick={() => props.userChanged(null)}>
                    Abbrechen
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export default UserChooser

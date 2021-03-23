import React from "react";
import {Termin} from "../model/model";
import {useSelector} from "react-redux";
import {selectTermineEnriched} from "../state/selectors";
import DeleteIcon from '@material-ui/icons/Delete';
import store from "../index";
import {deleteTermin} from "../integration/integration";
import {createStyles, makeStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Paper from '@material-ui/core/Paper';
import {IconButton} from "@material-ui/core";
import {prettyPrintDate, unPrettifyDate} from "../utils/date-utils";

interface TerminRow {
    id: string,
    name: string,
    start: string;
    ende: string;
    deleteUserId: string;
}

export const createData = (termin: Termin): TerminRow => {
    return {
        id: termin.id,
        name: termin.mieterName ? termin.mieterName : '',
        start: prettyPrintDate(termin.terminBeginn),
        ende: prettyPrintDate(termin.terminEnde),
        deleteUserId: termin.id
    };
};


const descendingComparator = (left: TerminRow, right: TerminRow, orderBy: keyof TerminRow) => {
    const isKeyDate: boolean = orderBy === "start" || orderBy === "ende";
    const valueLeft = isKeyDate ? unPrettifyDate(left[orderBy]) : left[orderBy];
    const valueRight = isKeyDate ? unPrettifyDate(right[orderBy]) : right[orderBy];

    if (valueRight < valueLeft) {
        return -1;
    }
    if (valueRight > valueLeft) {
        return 1;
    }
    return 0;
};

type Order = 'asc' | 'desc';

const getComparator = <Key extends keyof TerminRow>(
    order: Order,
    orderBy: Key,
): (left: TerminRow, right: TerminRow) => number => order === 'desc'
    ? (left: TerminRow, right: TerminRow) => descendingComparator(left, right, orderBy)
    : (left: TerminRow, right: TerminRow) => -descendingComparator(left, right, orderBy);

const stableSort = <T extends any>(array: T[], comparator: (a: T, b: T) => number) => {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
        const order = comparator(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
};

interface HeadCell {
    disablePadding: boolean;
    id: keyof TerminRow;
    label: string;
    numeric: boolean;
}

const headCells: HeadCell[] = [
    {id: 'name', numeric: false, disablePadding: true, label: 'Mietername'},
    {id: 'start', numeric: true, disablePadding: false, label: 'Beginn'},
    {id: 'ende', numeric: true, disablePadding: false, label: 'Ende'},
    {id: 'deleteUserId', numeric: true, disablePadding: false, label: 'Löschen'}
];

interface EnhancedTableProps {
    classes: ReturnType<typeof useStyles>;
    numSelected: number;
    onRequestSort: (event: React.MouseEvent<unknown>, property: keyof TerminRow) => void;
    order: Order;
    orderBy: string;
    rowCount: number;
}

const useStyles = makeStyles(() =>
    createStyles({
        root: {
            width: '100%',
        },
        paper: {
            marginTop: '50px',
            marginBottom: 'auto',
            marginInline: 'auto',
            width: "80%",
            backgroundColor: '#edcfb7'
        },
        table: {
            minWidth: 750,
        },
        visuallyHidden: {
            border: 0,
            clip: 'rect(0 0 0 0)',
            height: 1,
            margin: -1,
            overflow: 'hidden',
            padding: 0,
            position: 'absolute',
            top: 20,
            width: 1,
        },
        tablecell: {
            padding: 10,
        },
    }),
);

const EnhancedTableHead = (props: EnhancedTableProps) => {
    const {classes, order, orderBy, onRequestSort} = props;
    const createSortHandler = (property: keyof TerminRow) => (event: React.MouseEvent<unknown>) => {
        onRequestSort(event, property);
    };

    return (
        <TableHead>
            <TableRow>
                <TableCell className={classes.tablecell}/>
                {headCells.map((headCell: HeadCell) => (
                    <TableCell
                        key={headCell.id}
                        align={headCell.numeric ? 'right' : 'left'}
                        padding={headCell.disablePadding ? 'none' : 'default'}
                        sortDirection={orderBy === headCell.id ? order : false}
                    >
                        <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={createSortHandler(headCell.id)}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                                <span className={classes.visuallyHidden}>
                                    {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                                </span>
                            ) : null}
                        </TableSortLabel>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};


export default function EnhancedTable() {
    const classes = useStyles();
    const [order, setOrder] = React.useState<Order>('asc');
    const [orderBy, setOrderBy] = React.useState<keyof TerminRow>('name');
    const [selected] = React.useState<string[]>([]);
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(5);

    const termine: Termin[] | undefined = useSelector(selectTermineEnriched);
    const terminRows = termine!.map((termin: Termin) => createData(termin));

    const handleRequestSort = (event: React.MouseEvent<unknown>, property: keyof TerminRow) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const emptyRows = rowsPerPage - Math.min(rowsPerPage, terminRows.length - page * rowsPerPage);

    const removeTermin = (id: number | string) => {
        store.dispatch(deleteTermin(id as string));
    };

    return (
        <div className={classes.root}>
            <Paper className={classes.paper} elevation={6}>
                <TableContainer>
                    <Table
                        className={classes.table}
                        aria-labelledby="tableTitle"
                        aria-label="enhanced table"
                    >
                        <EnhancedTableHead
                            classes={classes}
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onRequestSort={handleRequestSort}
                            rowCount={terminRows.length}
                        />
                        <TableBody>
                            {stableSort(terminRows, getComparator(order, orderBy))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    const labelId = `enhanced-table-checkbox-${index}`;

                                    return (
                                        <TableRow
                                            role="checkbox"
                                            tabIndex={-1}
                                            key={row.id}
                                        >
                                            <TableCell className={classes.tablecell}>

                                            </TableCell>
                                            <TableCell component="th" id={labelId} scope="row" padding="none">
                                                {row.name}
                                            </TableCell>
                                            <TableCell align="right">{row.start}</TableCell>
                                            <TableCell align="right">{row.ende}</TableCell>
                                            <TableCell align="right">
                                                <IconButton onClick={() => removeTermin(row.id)} aria-label="delete"
                                                            color="secondary">
                                                    <DeleteIcon/>
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            {emptyRows > 0 && (
                                <TableRow>
                                    <TableCell colSpan={6}/>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[5, 10]}
                    component="div"
                    count={terminRows.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onChangePage={handleChangePage}
                    onChangeRowsPerPage={handleChangeRowsPerPage}
                />
            </Paper>
        </div>
    );
}

import React from "react";
import { Button } from "@material-ui/core";
import { useSelector } from "react-redux";
import { selectTermineEnriched } from "../state/selectors";
import { Termin } from "../model/model";

const Termine = () => {
  const termine: Termin[] | undefined = useSelector(selectTermineEnriched);
  
  function deleteTermin() {
    confirm("Willst Du den Termin wirklich löschen?")
  }
  return (
    <ul>
      {termine?.map((termin: Termin) => (
        <li key={termin.id}>
          TerminId: {termin.id} Mieterpartei: {termin.mieterName} Beginn:{" "}
          {termin.terminBeginn} Ende: {termin.terminEnde}
          <Button onClick={() => deleteTermin()}>Löschen</Button>
        </li>
      ))}
    </ul>
  );
};

export default Termine;

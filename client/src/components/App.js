import React, {useEffect, useState} from 'react'
import * as Services from "../../../server/Services/services";


const App = () => {
    const [users, setUsers] = useState([])

    const getUsers = () => {
        Services.getRoute('http://localhost:4040/users', {})
            .then(({ data }) => {
                setUsers(data)
                console.log('--users data---', users)
            })
            .finally(() => {
            })
    }
    useEffect(()=>{
        getUsers()
    },[])
    return (
        <div>
            <h1>Hello World Gayathri</h1>
        </div>
    )
}

export default App
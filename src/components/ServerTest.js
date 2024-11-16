import { useEffect, useState } from 'react';

export default function TestServer() {
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const serverStatus = async() => {
            try {
                const connect = await fetch('http://127.0.0.1:5000/server-test',
                    {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                    }
                )
                if (connect.ok) {
                    const response = await connect.json()
                    setMessage(response.message)
                }
            } catch (error) {
                setError(error.message)
            }
        }

        serverStatus()
    }, [])

    return (
        <div>
            {error ? (
                <div className='error-cont'>
                    <h2>{error}</h2>
                </div>
            ) : (
                <div className='message-cont'>
                    <h2>{message}</h2>
                </div>
            )}
        </div>
    )
}
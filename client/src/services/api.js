
const API_URL = 'http://localhost:4000/api';

export const fetchCheckTests = async (formData) => {
    try {
        console.log(formData)
        const response = await fetch(`http://localhost:4000/api/check`, {
            method: 'POST',
            headers: { 'Content-Type': 'multipart/form-data' },
            body: formData
        });
        if (!response.ok) {
            throw new Error('Failed to fetch check tests');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching check tests:', error);
        return [];
    }
}

export const fetchCheckJson = async (taskObj) => {
    try {
        const response = await fetch('http://localhost:4000/api/check', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(taskObj),
        })
        if (!response.ok) {
            throw new Error('Failed to fetch check json');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching check json:', error);
        return [];
    }
}


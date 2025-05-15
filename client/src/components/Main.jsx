

import { useState, useRef } from "react";
import '../styles/Main.css';
import { FiFilePlus, FiFile, FiFolder, FiUpload, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

const Main = () => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [results, setResults] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const fileInputRef = useRef(null);
    const directoryInputRef = useRef(null);

    // Очистка инпутов
    const resetInputs = () => {
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (directoryInputRef.current) directoryInputRef.current.value = '';
    };

    // Добавление файлов
    const addFiles = (newFiles) => {
        const imageFiles = newFiles.filter(file =>
            file.type.startsWith('image/') &&
            !files.some(f => f.name === file.name && f.size === file.size)
        );
        setFiles(prev => [...prev, ...imageFiles]);
        resetInputs();
    };

    // Обработчики drag/drop
    const handleDragEnter = (e) => e.preventDefault() || setIsDragging(true);
    const handleDragLeave = (e) => e.preventDefault() || setIsDragging(false);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
    };
    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            addFiles(Array.from(e.target.files));
        }
    };

    const handleDirectoryChange = (e) => {
        const files = [];
        const fileList = e.target.files;

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (file.type.startsWith('image/')) {
                files.push(file);
            }
        }

        addFiles(files);
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        resetInputs();
    };

    // Отправка файлов
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (files.length === 0) return alert("Пожалуйста, выберите файлы");

        setLoading(true);
        const formData = new FormData();
        files.forEach(file => formData.append("files", file));

        try {
            const response = await fetch('http://localhost:4000/api/check', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            console.log('Upload response:', data);
            setResults(data);
            setCurrentIndex(0);
        } catch (error) {
            console.error('Upload error:', error);
            alert("Ошибка загрузки файлов");
        } finally {
            setLoading(false);
        }
    };

    // Навигация по результатам
    const nextResult = () => setCurrentIndex(prev => (prev + 1) % results.length);
    const prevResult = () => setCurrentIndex(prev => (prev - 1 + results.length) % results.length);
    const closeResults = () => setResults(null);

    return (
        <div className="container">
            {results ? (
                <div className="result-view">
                    <div className="result-header">
                        <h2>Результаты проверки</h2>
                    </div>
                    <button onClick={closeResults} className="close-btn">
                        <FiX size={32} />
                    </button>

                    <div className="result-navigation">
                        <button onClick={prevResult} className="nav-btn left">
                            <FiChevronLeft size={36} />
                        </button>

                        <div className="result-content">
                            <img
                                src={`http://localhost:4000${results[currentIndex].imageUrl}`}
                                alt={results[currentIndex].originalName}
                                className="result-image"
                            />
                            <div className="result-details">
                                {/* такая жесть с именем, чтобы русские названия не превращались в кракозябры */}
                                <h3 className="result-file-name">{new TextDecoder('utf-8').decode(new TextEncoder().encode(results[currentIndex].originalName))}</h3>
                                <pre>
                                    {JSON.stringify(results[currentIndex].solutions, null, 2)}
                                </pre>
                            </div>
                        </div>

                        <button onClick={nextResult} className="nav-btn right">
                            <FiChevronRight size={36} />
                        </button>
                    </div>

                    <div className="result-counter">
                        {currentIndex + 1} / {results.length}
                    </div>
                </div>
            ) : (
                <div className="container">
                    <div className={`input-box ${isDragging ? "dragging" : ""}`}>
                        <h1 className="title">Загрузите изображения с работами для проверки</h1>
                        <form className="input-form" onSubmit={handleSubmit}>
                            <div
                                className="drop-zone"
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileInputRef}
                                    className="file-input"
                                    type="file"
                                    onChange={handleFileChange}
                                    multiple
                                    accept="image/*"
                                    hidden
                                />
                                <input
                                    ref={directoryInputRef}
                                    className="file-input"
                                    type="file"
                                    onChange={handleDirectoryChange}
                                    webkitdirectory="true"
                                    accept="image/*"
                                    hidden
                                />
                                <div className="drop-zone-content">
                                    <FiFilePlus className="upload-icon" />
                                    <p>Перетащите файлы сюда или</p>
                                    <div className="upload-buttons">
                                        <button
                                            type="button"
                                            className="btn select-file-btn"
                                            onClick={() => fileInputRef.current.click()}
                                        >
                                            <FiUpload /> Выбрать файлы
                                        </button>
                                        <button
                                            type="button"
                                            className="btn select-dir-btn"
                                            onClick={() => directoryInputRef.current.click()}
                                        >
                                            <FiFolder /> Выбрать папку
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {files.length > 0 && (
                                <div className="file-list">
                                    <h3 className="file-list-header">Выбранные файлы ({files.length}) :</h3>
                                    <div className="file-list-content">
                                        {files.map((file, index) => (
                                            <div className="file-list-elem" key={`${file.name}-${file.size}-${file.lastModified}`}>
                                                <FiFile className="file-icon" />
                                                <span>{file.name}</span>
                                                <button
                                                    type="button"
                                                    className="remove-btn curcle-btn"
                                                    onClick={() => removeFile(index)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* {loading && (
                                <div className="progress-container">
                                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                                    <span>{progress}%</span>
                                </div>
                            )} */}

                            <button
                                className="btn upload-btn gradient-background"
                                type="submit"
                                disabled={files.length === 0}
                            >
                                {loading ? 'Обработка...' : 'Проверить работы'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Main;
package com.resumerebuilder.ai.model;

import java.util.ArrayList;
import java.util.List;

public class Skills {
    private List<String> programmingLanguages = new ArrayList<>();
    private List<String> frameworks = new ArrayList<>();
    private List<String> libraries = new ArrayList<>();
    private List<String> databases = new ArrayList<>();
    private List<String> tools = new ArrayList<>();
    private List<String> cloudPlatforms = new ArrayList<>();
    private List<String> other = new ArrayList<>();

    // Getters and Setters
    public List<String> getProgrammingLanguages() {
        return programmingLanguages;
    }

    public void setProgrammingLanguages(List<String> programmingLanguages) {
        this.programmingLanguages = programmingLanguages;
    }

    public List<String> getFrameworks() {
        return frameworks;
    }

    public void setFrameworks(List<String> frameworks) {
        this.frameworks = frameworks;
    }

    public List<String> getLibraries() {
        return libraries;
    }

    public void setLibraries(List<String> libraries) {
        this.libraries = libraries;
    }

    public List<String> getDatabases() {
        return databases;
    }

    public void setDatabases(List<String> databases) {
        this.databases = databases;
    }

    public List<String> getTools() {
        return tools;
    }

    public void setTools(List<String> tools) {
        this.tools = tools;
    }

    public List<String> getCloudPlatforms() {
        return cloudPlatforms;
    }

    public void setCloudPlatforms(List<String> cloudPlatforms) {
        this.cloudPlatforms = cloudPlatforms;
    }

    public List<String> getOther() {
        return other;
    }

    public void setOther(List<String> other) {
        this.other = other;
    }
}

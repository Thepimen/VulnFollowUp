package com.vulnfollowup.service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

/**
 * Proceso hijo independiente ejecutado por {@link ProcessBuilder} para generar informes
 * ejecutivos en formato CSV o HTML en un proceso aislado del sistema operativo (PSP 2.º DAM).
 */
public final class PspReportWorker {

    private PspReportWorker() {
    }

    public static void main(String[] args) {
        if (args.length < 3) {
            System.err.println("Uso: PspReportWorker <CSV|HTML> <inputTsvFile> <outputFile>");
            System.exit(2);
        }
        String format = args[0].trim().toUpperCase(Locale.ROOT);
        Path inputPath = Path.of(args[1]);
        Path outputPath = Path.of(args[2]);

        try {
            List<String> lines = Files.readAllLines(inputPath, StandardCharsets.UTF_8);
            String rendered = "HTML".equals(format) ? renderHtml(lines) : renderCsv(lines);
            Files.writeString(outputPath, rendered, StandardCharsets.UTF_8);
            System.out.println("OK:" + format + ":rows=" + lines.size());
            System.exit(0);
        } catch (Exception ex) {
            System.err.println("ERROR_WORKER:" + ex.getMessage());
            System.exit(1);
        }
    }

    private static String renderCsv(List<String> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("internal_code,cve_id,title,cvss_version,cvss_score,severity,status,primary_provider\n");
        for (String row : rows) {
            if (row == null || row.isBlank()) {
                continue;
            }
            String[] cols = row.split("\t", -1);
            List<String> escaped = new ArrayList<>(cols.length);
            for (String col : cols) {
                escaped.add(csvCell(col));
            }
            sb.append(String.join(",", escaped)).append('\n');
        }
        return sb.toString();
    }

    private static String renderHtml(List<String> rows) {
        StringBuilder sb = new StringBuilder();
        sb.append("<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\">")
                .append("<title>Informe Ejecutivo DORA - VulnFollowUp</title></head><body>")
                .append("<h1>Informe Ejecutivo de Vulnerabilidades DORA</h1>")
                .append("<p>Generado por subproceso OS (ProcessBuilder): ")
                .append(OffsetDateTime.now(ZoneOffset.UTC)).append("</p>")
                .append("<table border=\"1\"><thead><tr>")
                .append("<th>Codigo</th><th>CVE</th><th>Titulo</th><th>Version CVSS</th>")
                .append("<th>Nota</th><th>Severidad</th><th>Estado</th><th>Proveedor TIC</th>")
                .append("</tr></thead><tbody>");
        for (String row : rows) {
            if (row == null || row.isBlank()) {
                continue;
            }
            String[] cols = row.split("\t", -1);
            sb.append("<tr>");
            for (String col : cols) {
                sb.append("<td>").append(htmlEscape(col)).append("</td>");
            }
            sb.append("</tr>");
        }
        sb.append("</tbody></table></body></html>");
        return sb.toString();
    }

    private static String csvCell(String val) {
        if (val == null) {
            return "";
        }
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }

    private static String htmlEscape(String val) {
        if (val == null) {
            return "";
        }
        return val.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
